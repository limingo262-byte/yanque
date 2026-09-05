"""命令行多轮问答，用来在没有 Java 的情况下单独验证 AI 服务这一层。

直接调 ChatService，不经过 HTTP，方便定位问题出在模型还是接口。

运行：
  uv run python test/chat_cli.py

退出：输入 exit / quit，或按 Ctrl+C
清空上下文：输入 clear
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from yanque_ai.common.config import ConfigError, get_settings  # noqa: E402
from yanque_ai.common.errors import AIServiceError  # noqa: E402
from yanque_ai.integrations.bailian.client import BailianClient  # noqa: E402
from yanque_ai.modules.chat.schemas import ChatMessage, ChatRequest, Role  # noqa: E402
from yanque_ai.modules.chat.service import ChatService  # noqa: E402


def run() -> int:
    try:
        settings = get_settings()
    except ConfigError as exc:
        print(f"配置错误：{exc}")
        print("提示：复制 .env.example 为 .env，填入 DASHSCOPE_API_KEY")
        return 2

    client = BailianClient(settings)
    service = ChatService(client, settings)
    history: list[ChatMessage] = []

    print(f"模型：{settings.model}    模式：流式")
    print("输入问题开始对话，exit 退出，clear 清空上下文\n")

    try:
        while True:
            try:
                question = input("你 > ").strip()
            except EOFError:
                break
            if not question:
                continue
            if question in {"exit", "quit"}:
                break
            if question == "clear":
                history.clear()
                print("（上下文已清空）\n")
                continue

            request = ChatRequest(question=question, history=history)
            print("AI > ", end="", flush=True)

            answer = ""
            try:
                # 复现 Java 的双重角色：一边打印碎片，一边攒成整段
                for raw in service.stream_chat(request):
                    event, payload = _parse_sse(raw)
                    if event == "delta":
                        piece = payload.get("content", "")
                        answer += piece
                        print(piece, end="", flush=True)
                    elif event == "done":
                        usage = payload.get("usage") or {}
                        print(f"\n（tokens：{usage.get('total_tokens', 0)}）")
                    elif event == "error":
                        print(f"\n调用失败：{payload.get('message')}")
            except AIServiceError as exc:
                print(f"\n调用失败 [{exc.code}]：{exc.message}")
                continue

            if answer:
                # 一问一答都进历史，下一轮再整个发回给模型——这就是"多轮对话"的本质
                history.append(ChatMessage(role=Role.USER, content=question))
                history.append(ChatMessage(role=Role.ASSISTANT, content=answer))
            print()
    except KeyboardInterrupt:
        print()
    finally:
        client.close()

    return 0


def _parse_sse(raw: str) -> tuple[str, dict]:
    event = ""
    data = "{}"
    for line in raw.splitlines():
        if line.startswith("event: "):
            event = line[len("event: ") :]
        elif line.startswith("data: "):
            data = line[len("data: ") :]
    return event, json.loads(data)


def main() -> int:
    return run()


if __name__ == "__main__":
    sys.exit(main())
