"""通过 Bear MCP 只读检查个人 yanque 数据库的 Text-to-SQL 业务表。"""

import asyncio
import json

from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client


async def main() -> None:
    async with streamablehttp_client(
        "http://127.0.0.1:8091/mcp",
        headers={"Authorization": "Bearer mcp_dev_token"},
    ) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            queries = {
                "tables": (
                    "SELECT table_name, table_comment, table_rows "
                    "FROM information_schema.tables "
                    "WHERE table_schema = 'yanque' "
                    "AND table_name IN ('sys_class', 'student', 'order_payment') "
                    "ORDER BY table_name"
                ),
                "class_student_count": (
                    "SELECT c.class_period, COUNT(s.id) AS student_count "
                    "FROM sys_class c LEFT JOIN student s ON s.class_id = c.id "
                    "GROUP BY c.id, c.class_period ORDER BY student_count DESC"
                ),
                "order_summary": (
                    "SELECT status, COUNT(*) AS order_count, "
                    "SUM(order_amount - refunded_amount) AS net_amount "
                    "FROM order_payment GROUP BY status"
                ),
            }
            for name, sql in queries.items():
                result = await session.call_tool(
                    "query_data_source",
                    arguments={"datasourceId": 1, "sql": sql},
                )
                print(name + "=")
                if hasattr(result, "model_dump"):
                    print(json.dumps(result.model_dump(mode="json"), ensure_ascii=False, indent=2))
                else:
                    print(result)


if __name__ == "__main__":
    asyncio.run(main())
