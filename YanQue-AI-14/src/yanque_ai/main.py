"""YanQue AI 服务启动入口。"""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

import uvicorn

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from yanque_ai.common.application import create_app
else:
    from .common.application import create_app


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

app = create_app()


def run() -> None:
    """本地启动服务。"""
    # Keep the historical default while allowing local deployments to avoid
    # port conflicts with another YanQue-AI instance.
    host = os.getenv("YANQUE_AI_HOST", "0.0.0.0")
    port = int(os.getenv("YANQUE_AI_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    run()
