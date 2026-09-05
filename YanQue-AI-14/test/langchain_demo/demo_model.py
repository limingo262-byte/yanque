import sys
from pathlib import Path

from langchain_openai import ChatOpenAI


sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

from yanque_ai.common.config import get_settings  # noqa: E402


def build_demo_model() -> ChatOpenAI:
    """创建课堂 demo 使用的 LangChain 模型对象。"""

    settings = get_settings()
    return ChatOpenAI(
        model=settings.model,
        api_key=settings.api_key,
        base_url=settings.base_url,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens,
    )
