"""LangChain 模型工厂。"""

from __future__ import annotations

import httpx
from langchain_openai import ChatOpenAI

from ..common.config import Settings


def build_chat_model(settings: Settings, *, temperature: float | None = None) -> ChatOpenAI:
    """创建接入百炼 OpenAI 兼容接口的 LangChain ChatModel。"""
    return ChatOpenAI(
        model=settings.model,
        api_key=settings.api_key,
        base_url=settings.base_url,
        temperature=settings.temperature if temperature is None else temperature,
        max_tokens=settings.max_tokens,
        timeout=settings.timeout_seconds,
        max_retries=settings.max_retries,
        # 本地开发环境可能残留不可用的 HTTP_PROXY；百炼走直连，避免模型请求
        # 被错误转发到失效代理。MCP 的本地请求仍使用自己的 HTTP 会话。
        http_client=httpx.Client(
            timeout=settings.timeout_seconds,
            trust_env=False,
        ),
        http_async_client=httpx.AsyncClient(
            timeout=settings.timeout_seconds,
            trust_env=False,
        ),
    )
