"""通过 Bear MCP 真实验证 YanQue Text-to-SQL 的发现、读取和查询链路。"""

import asyncio
import json

from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client


MCP_URL = "http://127.0.0.1:8091/mcp"
MCP_TOKEN = "mcp_dev_token"


def dump(value):
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json", by_alias=True, exclude_none=True)
    return json.dumps(value, ensure_ascii=False, default=str)


async def main() -> None:
    async with streamablehttp_client(
        MCP_URL,
        headers={"Authorization": f"Bearer {MCP_TOKEN}"},
    ) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            tools = await session.list_tools()
            resources = await session.list_resources()
            prompts = await session.list_prompts()
            print("tools=", [tool.name for tool in tools.tools])
            print("resources=", [resource.uri for resource in resources.resources if "yanque/text-to-sql" in str(resource.uri)])
            print("prompts=", [prompt.name for prompt in prompts.prompts])

            prompt = await session.get_prompt(
                "yanque_text_to_sql",
                {
                    "question": "查询每个班级的学生人数，按人数从高到低排列",
                    "datasource_id": "1",
                    "max_rows": "100",
                    "execute_sql": "true",
                },
            )
            print("prompt_messages=", len(prompt.messages))

            skill = await session.call_tool(
                "get_skill",
                arguments={"skillCode": "SKILL0000000001"},
            )
            print("skill_result=", not getattr(skill, "isError", False))

            resource = await session.read_resource("bear://yanque/text-to-sql/metrics/student")
            print("metrics_resource=", bool(resource.contents))

            query = await session.call_tool(
                "query_data_source",
                arguments={
                    "datasourceId": 1,
                    "sql": "SELECT sc.class_period, COUNT(s.id) AS student_count FROM student s LEFT JOIN sys_class sc ON s.class_id = sc.id GROUP BY sc.class_period ORDER BY student_count DESC",
                },
            )
            print("query_result=", dump(query))

            for sql in (
                "UPDATE student SET status='INACTIVE' WHERE id=1",
                "SELECT * FROM student",
            ):
                rejected = await session.call_tool(
                    "query_data_source",
                    arguments={"datasourceId": 1, "sql": sql},
                )
                print("security_rejected=", getattr(rejected, "isError", False), sql.split()[0])


if __name__ == "__main__":
    asyncio.run(main())
