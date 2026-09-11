"""本地 Agent 节点模型。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from ..modules.analysis_tasks.schemas import AnalysisResult


class AgentJobRequest(BaseModel):
    task_id: str = Field(min_length=3, max_length=128)
    question: str = Field(min_length=2, max_length=4000)


class AgentJob(BaseModel):
    task_id: str
    status: Literal["ACCEPTED", "RUNNING", "SUCCESS", "FAILED"]
    worker_id: str
    result: AnalysisResult | None = None
    error: str | None = None
