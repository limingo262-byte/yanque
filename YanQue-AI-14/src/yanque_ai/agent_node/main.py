"""本地 Codex Agent 节点启动入口。"""

from __future__ import annotations

import os

import uvicorn

from .app import create_agent_app


app = create_agent_app()


def run() -> None:
    uvicorn.run(
        app,
        host=os.getenv("AGENT_NODE_HOST", "127.0.0.1"),
        port=int(os.getenv("AGENT_NODE_PORT", "8787")),
    )


if __name__ == "__main__":
    run()
