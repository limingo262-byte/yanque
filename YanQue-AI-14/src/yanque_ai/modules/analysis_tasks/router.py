"""服务器侧分析任务接口。"""

from __future__ import annotations

import os
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status

from .schemas import AnalysisTask, AnalysisTaskCreate
from .service import AnalysisTaskService


router = APIRouter(prefix="/internal/analysis/tasks", tags=["analysis-tasks"])
_service: AnalysisTaskService | None = None


def get_service() -> AnalysisTaskService:
    global _service
    if _service is None:
        _service = AnalysisTaskService()
    return _service


def authorize(authorization: str | None = Header(default=None)) -> None:
    configured = os.getenv("ANALYSIS_GATEWAY_TOKEN", "").strip()
    supplied = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not configured or not secrets.compare_digest(configured, supplied):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid gateway token")


@router.post("", response_model=AnalysisTask, status_code=status.HTTP_202_ACCEPTED)
async def create_task(
    payload: AnalysisTaskCreate,
    _: None = Depends(authorize),
) -> AnalysisTask:
    return await get_service().create(payload)


@router.get("/{task_id}", response_model=AnalysisTask)
async def get_task(task_id: str, _: None = Depends(authorize)) -> AnalysisTask:
    task = await get_service().get(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found")
    return task


@router.post("/{task_id}/retry", response_model=AnalysisTask, status_code=status.HTTP_202_ACCEPTED)
async def retry_task(task_id: str, _: None = Depends(authorize)) -> AnalysisTask:
    task = await get_service().retry(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="task not found")
    return task
