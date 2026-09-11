"""本地 Codex Agent HTTP 服务。"""

from __future__ import annotations

import os
import secrets

from fastapi import Depends, FastAPI, Header, HTTPException, status

from .runner import CodexRunner
from .schemas import AgentJob, AgentJobRequest


def create_agent_app(runner: CodexRunner | None = None) -> FastAPI:
    app = FastAPI(title="YanQue Local Codex Agent", version="0.1.0")
    active_runner = runner or CodexRunner()

    def authorize(authorization: str | None = Header(default=None)) -> None:
        configured = os.getenv("AGENT_NODE_TOKEN", "").strip()
        supplied = authorization.removeprefix("Bearer ").strip() if authorization else ""
        if not configured or not secrets.compare_digest(configured, supplied):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid agent token",
            )

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "worker_id": active_runner.worker_id}

    @app.post(
        "/api/agent/jobs",
        response_model=AgentJob,
        status_code=status.HTTP_202_ACCEPTED,
    )
    async def submit_job(
        payload: AgentJobRequest,
        _: None = Depends(authorize),
    ) -> AgentJob:
        return await active_runner.submit(payload)

    @app.get("/api/agent/jobs/{task_id}", response_model=AgentJob)
    async def get_job(
        task_id: str,
        _: None = Depends(authorize),
    ) -> AgentJob:
        job = await active_runner.get(task_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="job not found",
            )
        return job

    return app
