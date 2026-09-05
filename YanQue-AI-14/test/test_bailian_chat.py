"""
阿里云百炼 OpenAI 兼容接口测试脚本。

运行前配置环境变量：
  export DASHSCOPE_API_KEY="你的百炼 API Key"
  export BAILIAN_WORKSPACE_ID="你的业务空间 WorkspaceId"

可选配置：
  export BAILIAN_MODEL="qwen3.7-plus"
  export BAILIAN_BASE_URL="https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1"
  export BAILIAN_PROMPT="用一句话介绍你自己"

运行：
  uv run python test/test_bailian_chat.py
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_MODEL = "qwen3.7-plus"
DEFAULT_PROMPT = "请用一句话介绍你自己，并说明你是否能用于教学答疑。"


def build_base_url() -> str:
    """优先使用显式 BASE_URL，否则用北京地域业务空间域名。"""
    base_url = os.getenv("BAILIAN_BASE_URL")
    if base_url:
        return base_url.rstrip("/")

    workspace_id = os.getenv("BAILIAN_WORKSPACE_ID")
    if workspace_id:
        return f"https://{workspace_id}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1"

    return "https://dashscope.aliyuncs.com/compatible-mode/v1"


def request_chat_completion() -> dict[str, Any]:
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise RuntimeError("请先设置环境变量 DASHSCOPE_API_KEY")

    model = os.getenv("BAILIAN_MODEL", DEFAULT_MODEL)
    prompt = os.getenv("BAILIAN_PROMPT", DEFAULT_PROMPT)
    endpoint = f"{build_base_url()}/chat/completions"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "你是一个简洁、准确的中文 AI 助手。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }

    request = Request(
        endpoint,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urlopen(request, timeout=60) as response:
        body = response.read().decode("utf-8")
        return json.loads(body)


def main() -> int:
    try:
        result = request_chat_completion()
    except RuntimeError as exc:
        print(f"配置错误：{exc}")
        print("示例：export DASHSCOPE_API_KEY='sk-xxx'")
        return 2
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"HTTP 调用失败：{exc.code} {exc.reason}")
        print(body)
        return 1
    except URLError as exc:
        print(f"网络调用失败：{exc.reason}")
        return 1

    message = result["choices"][0]["message"]["content"]
    usage = result.get("usage", {})

    print("模型回复：")
    print(message)
    print()
    print("Token 用量：")
    print(json.dumps(usage, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
