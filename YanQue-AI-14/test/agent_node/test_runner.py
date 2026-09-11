from __future__ import annotations

import asyncio

from yanque_ai.agent_node.runner import CodexRunner, build_prompt
from yanque_ai.agent_node.schemas import AgentJobRequest
from yanque_ai.modules.analysis_tasks.schemas import AnalysisResult


class FakeRunner(CodexRunner):
    async def _execute_codex(self, question: str) -> AnalysisResult:
        return AnalysisResult(
            conclusion=f"已分析：{question}",
            log_evidence=["traceId=test"],
            suggestions=["检查支付回调"],
        )


def test_runner_is_idempotent_and_returns_structured_result() -> None:
    async def scenario() -> None:
        runner = FakeRunner()
        request = AgentJobRequest(task_id="TASK-001", question="支付失败")
        first = await runner.submit(request)
        second = await runner.submit(request)
        assert first is second
        for _ in range(20):
            if first.status == "SUCCESS":
                break
            await asyncio.sleep(0.01)
        assert first.status == "SUCCESS"
        assert first.result is not None
        assert first.result.conclusion == "已分析：支付失败"

    asyncio.run(scenario())


def test_prompt_requires_mcp_evidence_and_treats_logs_as_untrusted() -> None:
    prompt = build_prompt("登录失败")
    assert "SKILL0000000021" in prompt
    assert "只依据工具返回的证据" in prompt
    assert "不可信数据" in prompt
