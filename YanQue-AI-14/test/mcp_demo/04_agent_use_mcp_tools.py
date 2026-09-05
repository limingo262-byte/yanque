import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any

from langchain.agents import create_agent
from langchain_mcp_adapters.client import MultiServerMCPClient


PROJECT_DIR = Path(__file__).resolve().parents[2]
MCP_SERVER_URL = "http://127.0.0.1:8010/mcp"
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from test.agent_demo.message_printer import print_agent_messages
from test.langchain_demo.demo_model import build_demo_model


SYSTEM_PROMPT = (
    "你是燕雀课程助手。"
    "如果用户询问课程信息，优先调用工具查询真实课程数据。"
    "回答要简洁，适合初学者理解。"
)


logging.getLogger().setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("mcp.client.streamable_http").setLevel(logging.WARNING)
logging.getLogger("langchain_openai.chat_models._client_utils").setLevel(logging.WARNING)


def to_jsonable(value: Any) -> Any:
    """把 SDK / LangChain 对象转成适合课堂打印的 JSON。"""
    if hasattr(value, "name") and hasattr(value, "description") and hasattr(value, "args_schema"):
        args_schema = getattr(value, "args_schema", None)
        if hasattr(args_schema, "model_json_schema"):
            args_schema = args_schema.model_json_schema()
        return {
            "name": value.name,
            "description": value.description,
            "args_schema": args_schema,
        }
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json", by_alias=True, exclude_none=True)
    if isinstance(value, list):
        return [to_jsonable(item) for item in value]
    if isinstance(value, tuple):
        return [to_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: to_jsonable(item) for key, item in value.items()}
    return value


def print_json(title: str, value: Any) -> None:
    print(title)
    print(json.dumps(to_jsonable(value), ensure_ascii=False, indent=2, default=str))
    print()


async def main() -> None:
    # 这一步和 03_langchain_load_mcp_tools.py 一样：
    # 先让 LangChain 连接 MCP Server，并把 MCP Tool 转成 LangChain Tool。
    client = MultiServerMCPClient(
        {
            "yanque_course": {
                "transport": "streamable_http",
                "url": MCP_SERVER_URL,
            }
        }
    )

    print_json(
        "0. MultiServerMCPClient 配置",
        {
            "yanque_course": {
                "transport": "streamable_http",
                "url": MCP_SERVER_URL,
            }
        },
    )

    print("1. client.get_tools()：加载 MCP Tool")
    mcp_tools = await client.get_tools()
    print_json("响应转换后的 LangChain Tools", mcp_tools)

    print("2. client.get_resources()：读取 MCP Resource")
    print_json(
        "实际调用",
        {
            "python": "client.get_resources(...)",
            "server_name": "yanque_course",
            "uris": "yanque://course/mcp",
        },
    )
    course_resources = await client.get_resources(
        "yanque_course",
        uris="yanque://course/mcp",
    )
    course_context = "\n\n".join(resource.as_string() for resource in course_resources)
    print_json("响应 result", [resource.as_string() for resource in course_resources])

    prompt_arguments = {
        "course_name": "MCP 服务开发入门",
        "student_level": "Java 后端工程师",
    }
    print("3. client.get_prompt()：获取 MCP Prompt")
    print_json(
        "实际调用",
        {
            "python": "client.get_prompt(...)",
            "server_name": "yanque_course",
            "name": "course_study_plan",
            "arguments": prompt_arguments,
        },
    )
    study_plan_messages = await client.get_prompt(
        "yanque_course",
        "course_study_plan",
        arguments=prompt_arguments,
    )
    print_json("响应 result", study_plan_messages)

    # create_agent 是 LangChain 的 Agent 创建方法。
    # 这里的关键点是：tools 传入的是从 MCP Server 加载来的工具。
    agent = create_agent(
        model=build_demo_model(),
        tools=mcp_tools,
        system_prompt=SYSTEM_PROMPT,
    )

    user_question = "帮我查一下 MCP 课程是什么时候上，主要讲什么？"
    print_json(
        "4. Agent 输入",
        {
            "messages": [
                {
                    "role": "user",
                    "content": user_question,
                }
            ],
            "tools": [tool.name for tool in mcp_tools],
            "resource_preview": course_context,
            "prompt_preview": [to_jsonable(message) for message in study_plan_messages],
        },
    )

    result = await agent.ainvoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": user_question,
                }
            ]
        }
    )

    print("5. Agent 运行过程")
    print("如果下面出现 tool 消息，就说明 Agent 调用了 MCP Server 暴露的工具。")
    print_agent_messages(result["messages"])


if __name__ == "__main__":
    asyncio.run(main())
