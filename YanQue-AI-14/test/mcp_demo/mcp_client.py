import asyncio
from pprint import pprint

from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async def main():
    async with streamablehttp_client("http://127.0.0.1:8010/mcp") as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            # 初始化
            await session.initialize()
            # 调用工具
            result = await session.call_tool("query_course", arguments={"keyword": "langchain"})
            print(result)
            # 读取资源
            resource = await session.read_resource("yanque://course/langchain")
            pprint(resource)

asyncio.run(main())