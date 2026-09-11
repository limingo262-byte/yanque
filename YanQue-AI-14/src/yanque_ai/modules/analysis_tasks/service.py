"""Redis 任务存储和远程 Agent 节点调度。"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from datetime import datetime, timezone
from uuid import uuid4

import httpx
from redis.asyncio import Redis

from .schemas import AnalysisResult, AnalysisTask, AnalysisTaskCreate


logger = logging.getLogger(__name__)
TASK_KEY_PREFIX = "yanque:analysis:task:"
MESSAGE_KEY_PREFIX = "yanque:analysis:message:"
TASK_TTL_SECONDS = 7 * 24 * 60 * 60


class AnalysisTaskService:
    def __init__(self) -> None:
        self._agent_url = os.getenv("AGENT_NODE_URL", "").strip().rstrip("/")
        self._agent_token = os.getenv("AGENT_NODE_TOKEN", "").strip()
        self._poll_seconds = float(os.getenv("AGENT_NODE_POLL_SECONDS", "2"))
        self._timeout_seconds = float(os.getenv("AGENT_NODE_TIMEOUT_SECONDS", "240"))
        self._redis = Redis.from_url(
            os.getenv("ANALYSIS_REDIS_URL", "redis://localhost:6379/0"),
            decode_responses=True,
        )
        self._running: set[asyncio.Task[None]] = set()

    async def create(self, payload: AnalysisTaskCreate) -> AnalysisTask:
        if payload.source_message_id:
            old_id = await self._redis.get(MESSAGE_KEY_PREFIX + payload.source_message_id)
            if old_id and (old := await self.get(old_id)):
                return old

        now = datetime.now(timezone.utc)
        task = AnalysisTask(
            task_id=f"AT-{now:%Y%m%d%H%M%S}-{uuid4().hex[:8]}",
            question=payload.question.strip(),
            source=payload.source,
            source_message_id=payload.source_message_id,
            source_chat_id=payload.source_chat_id,
            requester_id=payload.requester_id,
            status="PENDING",
            created_at=now,
            updated_at=now,
        )
        await self._save(task)
        if payload.source_message_id:
            await self._redis.set(
                MESSAGE_KEY_PREFIX + payload.source_message_id,
                task.task_id,
                ex=TASK_TTL_SECONDS,
                nx=True,
            )
        self.dispatch(task.task_id)
        return task

    async def get(self, task_id: str) -> AnalysisTask | None:
        raw = await self._redis.get(TASK_KEY_PREFIX + task_id)
        return AnalysisTask.model_validate_json(raw) if raw else None

    async def retry(self, task_id: str) -> AnalysisTask | None:
        task = await self.get(task_id)
        if not task:
            return None
        task.status, task.error = "PENDING", None
        task.updated_at = datetime.now(timezone.utc)
        await self._save(task)
        self.dispatch(task_id)
        return task

    def dispatch(self, task_id: str) -> None:
        background = asyncio.create_task(self._dispatch_and_wait(task_id))
        self._running.add(background)
        background.add_done_callback(self._running.discard)

    async def _dispatch_and_wait(self, task_id: str) -> None:
        task = await self.get(task_id)
        if not task:
            return
        if not self._agent_url or not self._agent_token:
            await self._fail(task, "未配置 AGENT_NODE_URL 或 AGENT_NODE_TOKEN")
            return

        headers = {
            "Authorization": f"Bearer {self._agent_token}",
            "ngrok-skip-browser-warning": "true",
        }
        task.status = "DISPATCHING"
        task.updated_at = datetime.now(timezone.utc)
        await self._save(task)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self._agent_url}/api/agent/jobs",
                    headers=headers,
                    json={"task_id": task.task_id, "question": task.question},
                )
                response.raise_for_status()
            task.status = "RUNNING"
            task.updated_at = datetime.now(timezone.utc)
            await self._save(task)
            await self._poll_agent(task, headers)
        except Exception as exc:
            logger.exception("Agent 节点派发失败 task_id=%s", task.task_id)
            await self._fail(task, f"Agent 节点不可用：{type(exc).__name__}")

    async def _poll_agent(self, task: AnalysisTask, headers: dict[str, str]) -> None:
        deadline = time.monotonic() + self._timeout_seconds
        async with httpx.AsyncClient(timeout=15.0) as client:
            while time.monotonic() < deadline:
                await asyncio.sleep(self._poll_seconds)
                response = await client.get(
                    f"{self._agent_url}/api/agent/jobs/{task.task_id}",
                    headers=headers,
                )
                response.raise_for_status()
                remote = response.json()
                if remote["status"] == "SUCCESS":
                    task.status = "SUCCESS"
                    task.worker_id = remote.get("worker_id")
                    task.result = AnalysisResult.model_validate(remote["result"])
                    task.error = None
                    task.updated_at = datetime.now(timezone.utc)
                    await self._save(task)
                    return
                if remote["status"] == "FAILED":
                    await self._fail(task, remote.get("error") or "Codex 执行失败")
                    return
        task.status = "TIMEOUT"
        task.error = "等待本地 Codex 超时"
        task.updated_at = datetime.now(timezone.utc)
        await self._save(task)

    async def _fail(self, task: AnalysisTask, message: str) -> None:
        task.status = "FAILED"
        task.error = message[:500]
        task.updated_at = datetime.now(timezone.utc)
        await self._save(task)

    async def _save(self, task: AnalysisTask) -> None:
        await self._redis.set(
            TASK_KEY_PREFIX + task.task_id,
            task.model_dump_json(),
            ex=TASK_TTL_SECONDS,
        )
