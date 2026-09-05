"""学生问答 RAG 轻量测试。

运行：
  uv run python test/chat_rag_prompt_test.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from yanque_ai.modules.chat.prompts import build_messages  # noqa: E402
from yanque_ai.modules.chat.schemas import ChatMessage, ChatRequest, Role  # noqa: E402
from yanque_ai.modules.chat.service import ChatService  # noqa: E402


class FakeChunk:
    def __init__(self, delta: str = "", done: bool = False, finish_reason: str = "stop") -> None:
        self.delta = delta
        self.done = done
        self.finish_reason = finish_reason
        self.usage = None


class FakeClient:
    def __init__(self, rerank_results=None, rerank_error: Exception | None = None) -> None:
        self.rerank_results = rerank_results or []
        self.rerank_error = rerank_error

    def stream_chat(self, messages):
        self.messages = messages
        yield FakeChunk(delta="回答")
        yield FakeChunk(done=True)

    def rerank(self, query: str, documents: list[str], top_n: int):
        if self.rerank_error:
            raise self.rerank_error
        return self.rerank_results[:top_n]


class FailingVectorStore:
    def recall(self, collection_name: str, query: str, mode: str, top_k: int):
        raise RuntimeError("milvus unavailable")


class FixedVectorStore:
    def __init__(self, records):
        self.records = records
        self.top_k = None

    def recall(self, collection_name: str, query: str, mode: str, top_k: int):
        self.top_k = top_k
        return self.records[:top_k]


class FakeRerankResult:
    def __init__(self, index: int, score: float) -> None:
        self.index = index
        self.score = score


def fake_settings(**overrides):
    defaults = {
        "system_prompt": "",
        "max_history_messages": 20,
        "chat_rag_enabled": True,
        "chat_rag_collection": "QA",
        "chat_rag_recall_mode": "HYBRID",
        "chat_rag_top_k": 5,
        "chat_rag_recall_top_k": 20,
        "chat_rag_rerank_enabled": True,
        "chat_rag_rerank_min_score": 0.25,
        "model": "fake-model",
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def parse_event(raw: str) -> tuple[str, dict]:
    event = ""
    data = "{}"
    for line in raw.splitlines():
        if line.startswith("event: "):
            event = line[len("event: ") :]
        elif line.startswith("data: "):
            data = line[len("data: ") :]
    return event, json.loads(data)


def test_citations_are_added_to_user_message() -> None:
    messages = build_messages(
        "什么是 Spring Bean？",
        [],
        system_prompt="",
        citations=[
            {
                "rank": 1,
                "document_code": "spring",
                "chunk_index": 0,
                "content": "Bean 是由 Spring 容器管理的对象。",
            }
        ],
    )
    user_content = messages[-1]["content"]
    assert "学生问题：什么是 Spring Bean？" in user_content
    assert "【QA知识库参考资料】" in user_content
    assert "Bean 是由 Spring 容器管理的对象。" in user_content


def test_empty_citations_keep_rag_notice() -> None:
    messages = build_messages(
        "介绍一下未知框架",
        [],
        system_prompt="",
        citations=[],
    )
    assert "未检索到知识库依据" in messages[-1]["content"]
    assert "不要声称答案来自知识库" in messages[-1]["content"]


def test_rag_disabled_keeps_original_question() -> None:
    messages = build_messages(
        "解释 for 循环",
        [ChatMessage(role=Role.USER, content="上一问")],
        system_prompt="",
        citations=None,
    )
    assert messages[-1]["content"] == "解释 for 循环"


def test_recall_failure_falls_back_without_extra_sse() -> None:
    client = FakeClient()
    service = ChatService(client, fake_settings())
    service._vector_store = FailingVectorStore()

    events = [parse_event(raw)[0] for raw in service.stream_chat(ChatRequest(question="什么是 RAG？"))]
    assert events == ["delta", "done"]
    assert client.messages[-1]["content"] == "什么是 RAG？"


def test_rerank_filters_low_scores_and_reorders_context() -> None:
    records = [
        {"rank": 1, "document_code": "a", "chunk_index": 0, "content": "低相关内容"},
        {"rank": 2, "document_code": "b", "chunk_index": 0, "content": "高相关内容"},
        {"rank": 3, "document_code": "c", "chunk_index": 0, "content": "中相关内容"},
    ]
    client = FakeClient(
        rerank_results=[
            FakeRerankResult(index=1, score=0.91),
            FakeRerankResult(index=2, score=0.42),
            FakeRerankResult(index=0, score=0.12),
        ]
    )
    service = ChatService(client, fake_settings(chat_rag_top_k=2, chat_rag_recall_top_k=3))
    service._vector_store = FixedVectorStore(records)

    list(service.stream_chat(ChatRequest(question="怎么理解 Bean？")))
    user_content = client.messages[-1]["content"]
    assert "高相关内容" in user_content
    assert "中相关内容" in user_content
    assert "低相关内容" not in user_content
    assert user_content.index("高相关内容") < user_content.index("中相关内容")
    assert service._vector_store.top_k == 3


def test_rerank_failure_uses_recall_order() -> None:
    records = [
        {"rank": 1, "document_code": "a", "chunk_index": 0, "content": "召回内容A"},
        {"rank": 2, "document_code": "b", "chunk_index": 0, "content": "召回内容B"},
    ]
    client = FakeClient(rerank_error=RuntimeError("rerank unavailable"))
    service = ChatService(client, fake_settings(chat_rag_top_k=1, chat_rag_recall_top_k=2))
    service._vector_store = FixedVectorStore(records)

    events = [parse_event(raw)[0] for raw in service.stream_chat(ChatRequest(question="什么是 RAG？"))]
    assert events == ["delta", "done"]
    assert "召回内容A" in client.messages[-1]["content"]
    assert "召回内容B" not in client.messages[-1]["content"]


def main() -> int:
    test_citations_are_added_to_user_message()
    test_empty_citations_keep_rag_notice()
    test_rag_disabled_keeps_original_question()
    test_recall_failure_falls_back_without_extra_sse()
    test_rerank_filters_low_scores_and_reorders_context()
    test_rerank_failure_uses_recall_order()
    print("chat_rag_prompt_test passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
