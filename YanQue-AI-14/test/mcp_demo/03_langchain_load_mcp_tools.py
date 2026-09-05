import asyncio
import json
from typing import Any

from langchain_mcp_adapters.client import MultiServerMCPClient


MCP_SERVER_URL = "http://127.0.0.1:8010/mcp"


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
    # MultiServerMCPClient 是 LangChain 连接 MCP Server 的适配器。
    #
    # 这里使用 streamable_http：
    # 需要先启动 01_course_mcp_server.py，让它监听 http://127.0.0.1:8010/mcp。
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

    # 先通过 MCP session 看看服务端暴露了哪些 Resource 和 Prompt。
    async with client.session("yanque_course") as session:
        print("1. session.list_resources()：查看固定 Resource")
        resources = await session.list_resources()
        print_json("响应 result", resources)

        print("2. session.list_resource_templates()：查看 Resource 模板")
        resource_templates = await session.list_resource_templates()
        print_json("响应 result", resource_templates)

        print("3. session.list_prompts()：查看 Prompt")
        prompts = await session.list_prompts()
        print_json("响应 result", prompts)

    print("4. client.get_tools()：加载 MCP Tool")
    tools = await client.get_tools()
    print_json("响应转换后的 LangChain Tools", tools)

    print("5. 不创建 Agent，先直接调用 query_course 这个 LangChain Tool")
    tool_map = {tool.name: tool for tool in tools}
    tool_arguments = {"keyword": "MCP"}
    print_json(
        "实际调用",
        {
            "python": 'tool_map["query_course"].ainvoke(tool_arguments)',
            "tool_name": "query_course",
            "tool_arguments": tool_arguments,
        },
    )
    result = await tool_map["query_course"].ainvoke(tool_arguments)
    print_json("响应 result", result)

    print("6. 通过 MultiServerMCPClient 读取 Resource")
    print_json(
        "实际调用",
        {
            "python": "client.get_resources(...)",
            "server_name": "yanque_course",
            "uris": "yanque://course/mcp",
        },
    )
    resource_blobs = await client.get_resources(
        "yanque_course",
        uris="yanque://course/mcp",
    )
    print_json("响应 result", [resource.as_string() for resource in resource_blobs])

    print("7. 通过 MultiServerMCPClient 获取 Prompt")
    prompt_arguments = {
        "course_name": "MCP 服务开发入门",
        "student_level": "Java 后端工程师",
    }
    print_json(
        "实际调用",
        {
            "python": "client.get_prompt(...)",
            "server_name": "yanque_course",
            "name": "course_study_plan",
            "arguments": prompt_arguments,
        },
    )
    prompt_messages = await client.get_prompt(
        "yanque_course",
        "course_study_plan",
        arguments=prompt_arguments,
    )
    print_json("响应 result", prompt_messages)


if __name__ == "__main__":
    asyncio.run(main())
