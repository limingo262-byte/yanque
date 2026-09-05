"""MCP Resource 客户端封装。"""

from __future__ import annotations

import asyncio
import threading

from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from ...common.config import Settings


# Bear MCP 的 streamable HTTP 会话需要在一次上下文中完成 initialize/read/close。
# Text-to-SQL 图的上下文节点可能并行执行，进程内串行读取可避免多个短会话
# 同时触发服务端 SSE stream 重连。
_RESOURCE_READ_LOCK = threading.Lock()


class McpResourceClient:
    """读取 Bear MCP Server 暴露的 Resource。"""

    def __init__(self, settings: Settings) -> None:
        self._url = settings.bear_mcp_url
        self._headers = {
            "Authorization": f"Bearer {settings.bear_mcp_token}",
        }

    def read_text(self, uri: str) -> str:
        """读取指定 Resource URI 的 Markdown 正文。"""

        with _RESOURCE_READ_LOCK:
            return asyncio.run(self._read_text(uri))

    async def _read_text(self, uri: str) -> str:
        async with streamablehttp_client(self._url, headers=self._headers) as (
            read_stream,
            write_stream,
            _,
        ):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.read_resource(uri)

        if not result.contents:
            return ""
        first = result.contents[0]
        return getattr(first, "text", "") or ""
