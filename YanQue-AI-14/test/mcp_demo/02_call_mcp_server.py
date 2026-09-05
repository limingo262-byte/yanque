import asyncio
import json
from typing import Any

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


MCP_SERVER_URL = "http://127.0.0.1:8010/mcp"


def to_jsonable(value: Any) -> Any:
    """把 MCP SDK 的返回对象转成适合课堂打印的 JSON。"""
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json", by_alias=True, exclude_none=True)
    return value


def print_json(title: str, value: Any) -> None:
    print(title)
    print(json.dumps(to_jsonable(value), ensure_ascii=False, indent=2))
    print()


def print_request(method: str, params: dict[str, Any] | None = None) -> None:
    request = {"method": method}
    if params is not None:
        request["params"] = params
    print_json("请求", request)


async def main() -> None:
    # 这个文件不会启动 MCP Server。
    # 请先运行：
    # uv run python test/mcp_demo/01_course_mcp_server.py
    #
    # 然后这里通过 HTTP URL 连接它。
    async with streamable_http_client(MCP_SERVER_URL) as (
        read_stream,
        write_stream,
        _get_session_id,
    ):
        # ClientSession 把 HTTP 读写通道包装成 list_tools、call_tool 等方法。
        async with ClientSession(read_stream, write_stream) as session:
            # 初始化会话。可以理解成客户端和服务端先握手。
            print("1. initialize：初始化会话")
            print_request(
                "initialize",
                {
                    "protocolVersion": "由 MCP SDK 自动填写",
                    "capabilities": "由 MCP SDK 自动填写",
                    "clientInfo": "由 MCP SDK 自动填写",
                },
            )
            initialize_result = await session.initialize()
            print_json("响应 result", initialize_result)

            print("2. tools/list：看 MCP Server 暴露了哪些工具")
            print_request("tools/list")
            tools = await session.list_tools()
            print_json("响应 result", tools)

            print("3. tools/call：调用 query_course 工具")
            tool_arguments = {"keyword": "MCP"}
            print_request(
                "tools/call",
                {
                    "name": "query_course",
                    "arguments": tool_arguments,
                },
            )
            course_result = await session.call_tool(
                "query_course",
                tool_arguments,
            )
            print_json("响应 result", course_result)

            print("4. resources/list：看 MCP Server 暴露了哪些固定 Resource")
            print_request("resources/list")
            resources = await session.list_resources()
            print_json("响应 result", resources)

            print("5. resources/templates/list：看 MCP Server 暴露了哪些 Resource 模板")
            print_request("resources/templates/list")
            resource_templates = await session.list_resource_templates()
            print_json("响应 result", resource_templates)

            print("6. resources/read：读取一个 Resource")
            resource_uri = "yanque://course/mcp"
            print_request(
                "resources/read",
                {
                    "uri": resource_uri,
                },
            )
            resource_result = await session.read_resource(resource_uri)
            print_json("响应 result", resource_result)

            print("7. prompts/list：看 MCP Server 暴露了哪些 Prompt")
            print_request("prompts/list")
            prompts = await session.list_prompts()
            print_json("响应 result", prompts)

            print("8. prompts/get：获取一个 Prompt")
            prompt_arguments = {
                "course_name": "MCP 服务开发入门",
                "student_level": "Java 后端工程师",
            }
            print_request(
                "prompts/get",
                {
                    "name": "course_study_plan",
                    "arguments": prompt_arguments,
                },
            )
            prompt_result = await session.get_prompt(
                "course_study_plan",
                prompt_arguments,
            )
            print_json("响应 result", prompt_result)


if __name__ == "__main__":
    asyncio.run(main())
