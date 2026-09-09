"""Read-only online diagnosis through Bear MCP."""

import asyncio
import json
import os
import sys
import time

from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client


MCP_URL = os.getenv("BEAR_MCP_URL", "http://bear-mcp:8090/mcp")
MCP_TOKEN = os.environ["BEAR_MCP_TOKEN"]


def dump(value: object) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json", by_alias=True, exclude_none=True)
    return json.dumps(value, ensure_ascii=False, default=str)


async def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else "list"
    async with streamablehttp_client(
        MCP_URL,
        headers={"Authorization": f"Bearer {MCP_TOKEN}"},
    ) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            tools = await session.list_tools()
            names = sorted(tool.name for tool in tools.tools)
            selected = [
                name for name in names
                if any(part in name for part in ("log", "repository", "document", "skill"))
            ]
            print("TOOLS=" + ",".join(selected))
            required = {"query_yanque_sls_logs"}
            if mode == "source":
                required.add("run_repository_command")
            missing = sorted(required.difference(names))
            if missing:
                print("MISSING_TOOLS=" + ",".join(missing))
                return

            if mode == "logs":
                now = int(time.time())
                result = await session.call_tool(
                    "query_yanque_sls_logs",
                    arguments={
                        "from_time": now - 3600,
                        "to_time": now,
                        "service": "yanque-admin",
                        "keyword": "ERROR",
                        "line": 100,
                    },
                )
                print("LOG_RESULT=" + dump(result))
            elif mode == "source":
                result = await session.call_tool(
                    "run_repository_command",
                    arguments={
                        "repository": "yanque-admin",
                        "command": "rg",
                        "args": ["-n", "knowledge-bases", "src/main/java"],
                    },
                )
                print("SOURCE_RESULT=" + dump(result))


if __name__ == "__main__":
    asyncio.run(main())
