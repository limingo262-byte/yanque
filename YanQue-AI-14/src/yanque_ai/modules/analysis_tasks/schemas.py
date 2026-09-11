"""分析任务接口模型。"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


TaskStatus = Literal["PENDING", "DISPATCHING", "RUNNING", "SUCCESS", "FAILED", "TIMEOUT"]


class AnalysisTaskCreate(BaseModel):
    question: str = Field(min_length=2, max_length=4000)
    source: str = Field(default="manual", max_length=32)
    source_message_id: str | None = Field(default=None, max_length=128)
    source_chat_id: str | None = Field(default=None, max_length=128)
    requester_id: str | None = Field(default=None, max_length=128)


class AnalysisResult(BaseModel):
    conclusion: str
    log_evidence: list[str] = Field(default_factory=list)
    source_evidence: list[str] = Field(default_factory=list)
    database_evidence: list[str] = Field(default_factory=list)
    impact: str = ""
    suggestions: list[str] = Field(default_factory=list)
    missing_evidence: list[str] = Field(default_factory=list)


class AnalysisTask(BaseModel):
    task_id: str
    question: str
    source: str
    source_message_id: str | None = None
    source_chat_id: str | None = None
    requester_id: str | None = None
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    worker_id: str | None = None
    result: AnalysisResult | None = None
    error: str | None = None
