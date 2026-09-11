"""Feishu bot entrypoint backed by the YanQue analysis task gateway."""

from __future__ import annotations

import asyncio
import logging
import os
import re
from typing import Any

import httpx
from lark_oapi.channel import FeishuChannel

logger = logging.getLogger(__name__)
_PHONE = re.compile(r"(?<!\d)(1\d{2})\d{4}(\d{4})(?!\d)")


class FeishuAnalysisBot:
    def __init__(self) -> None:
        app_id = os.environ["FEISHU_APP_ID"].strip()
        app_secret = os.environ["FEISHU_APP_SECRET"].strip()
        self.gateway_url = os.getenv("ANALYSIS_GATEWAY_URL", "http://yanque-ai:8002").rstrip("/")
        self.gateway_token = os.environ["ANALYSIS_GATEWAY_TOKEN"].strip()
        self.poll_seconds = float(os.getenv("FEISHU_TASK_POLL_SECONDS", "2"))
        self.timeout_seconds = float(os.getenv("FEISHU_TASK_TIMEOUT_SECONDS", "300"))
        self.channel = FeishuChannel(app_id=app_id, app_secret=app_secret, transport="ws")
        self.channel.on("message", self.on_message)
        self.channel.on("error", self.on_error)

    async def on_message(self, message: Any) -> None:
        question = (message.content_text or "").strip()
        if not question:
            await self._reply(message, "目前只支持文字问题，请描述业务现象和大概时间。")
            return
        await self._reply(message, "正在分析，请稍候。")
        try:
            task = await self._create_task(message, question)
            result = await self._wait_task(task["task_id"])
            await self._reply(message, self._format_task(result))
        except Exception as exc:
            logger.exception("Feishu analysis failed message_id=%s", message.message_id)
            await self._reply(message, f"分析任务执行失败：{type(exc).__name__}。请稍后重试。")

    async def on_error(self, error: Any) -> None:
        logger.error("Feishu channel error: %s", error)

    async def _create_task(self, message: Any, question: str) -> dict[str, Any]:
        payload = {
            "question": question,
            "source": "feishu",
            "source_message_id": message.message_id,
            "source_chat_id": message.chat_id,
            "requester_id": message.sender_id,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{self.gateway_url}/internal/analysis/tasks",
                headers={"Authorization": f"Bearer {self.gateway_token}"},
                json=payload,
            )
            response.raise_for_status()
            return response.json()

    async def _wait_task(self, task_id: str) -> dict[str, Any]:
        deadline = asyncio.get_running_loop().time() + self.timeout_seconds
        async with httpx.AsyncClient(timeout=15) as client:
            while asyncio.get_running_loop().time() < deadline:
                await asyncio.sleep(self.poll_seconds)
                response = await client.get(
                    f"{self.gateway_url}/internal/analysis/tasks/{task_id}",
                    headers={"Authorization": f"Bearer {self.gateway_token}"},
                )
                response.raise_for_status()
                task = response.json()
                if task["status"] in {"SUCCESS", "FAILED", "TIMEOUT"}:
                    return task
        return {"status": "TIMEOUT", "error": "等待分析结果超时"}

    async def _reply(self, message: Any, text: str) -> None:
        safe_text = _PHONE.sub(r"\1****\2", text)[:12000]
        result = await self.channel.send(
            message.chat_id,
            {"text": safe_text},
            {"reply_to": message.message_id},
        )
        if not result.success:
            raise RuntimeError(f"Feishu reply failed: {result.error}")

    @staticmethod
    def _format_task(task: dict[str, Any]) -> str:
        if task.get("status") != "SUCCESS":
            return f"分析未完成：{task.get('error') or task.get('status') or '未知错误'}"
        result = task.get("result") or {}
        sections = [f"【结论】\n{result.get('conclusion') or '暂无明确结论'}"]
        for title, key in (
            ("关键日志证据", "log_evidence"),
            ("源码证据", "source_evidence"),
            ("数据库证据", "database_evidence"),
            ("建议处理", "suggestions"),
            ("缺失证据", "missing_evidence"),
        ):
            values = result.get(key) or []
            if values:
                sections.append(f"【{title}】\n" + "\n".join(f"- {item}" for item in values))
        if result.get("impact"):
            sections.append(f"【影响范围】\n{result['impact']}")
        return "\n\n".join(sections)

    async def run(self) -> None:
        await self.channel.connect()


def main() -> None:
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    asyncio.run(FeishuAnalysisBot().run())


if __name__ == "__main__":
    main()
