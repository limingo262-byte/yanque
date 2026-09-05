"""不依赖 LangChain 的 OpenAI 兼容工具调用演示。

这个 demo 直接使用 OpenAI SDK 调百炼兼容接口的 tools/function calling。
工具本身是普通 Python 函数，不使用 LangChain 的 Tool、Agent、Chain。

运行前配置：
  export DASHSCOPE_API_KEY="你的百炼 API Key"

可选配置：
  export BAILIAN_MODEL="qwen3.7-plus"
  export BAILIAN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
  export TOOL_CALLING_QUESTION="我明天有课吗？"

运行：
  uv run python test/tool_calling_openai_compatible_demo.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

from openai import OpenAI


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from yanque_ai.common.config import ConfigError, get_settings  # noqa: E402


CURRENT_STUDENT_ID = 10001


MOCK_STUDENTS = {
    10001: {"name": "小明", "classId": 7},
}

MOCK_CLASS_SCHEDULES = {
    (7, "2026-07-06"): {
        "found": True,
        "scheduleDate": "2026-07-06",
        "teacherName": "张老师",
        "stageName": "提示词工程",
        "dayNumber": 5,
        "courseContent": "提示词基础、结构化输出和工具调用入门",
        "classType": "CLASS",
    },
    (7, "2026-07-07"): {
        "found": True,
        "scheduleDate": "2026-07-07",
        "teacherName": "李老师",
        "stageName": "LangChain 框架实战",
        "dayNumber": 6,
        "courseContent": "Runnable、链式调用和流式输出",
        "classType": "CLASS",
    },
    (7, "2026-07-08"): {
        "found": True,
        "scheduleDate": "2026-07-08",
        "teacherName": "",
        "stageName": "项目练习",
        "dayNumber": 7,
        "courseContent": "学生端 AI 问答工具调用练习",
        "classType": "SELF_STUDY",
    },
}


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_student_day_schedule",
            "description": "查询当前登录学生在指定日期的课程安排，适合回答今天、明天、某一天上什么课的问题。",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "要查询的日期，格式为 yyyy-MM-dd。必须把今天、明天换算成具体日期。",
                    }
                },
                "required": ["date"]
            },
        },
    }
]


def get_student_day_schedule(current_student_id: int, date_text: str) -> dict[str, Any]:
    """查询当前登录学生某天课程。

    current_student_id 来自登录态，不接受模型传入。
    模型只能决定 date_text。
    """

    schedule_date = date_text.strip()
    student = MOCK_STUDENTS.get(current_student_id)
    if student is None:
        return {
            "found": False,
            "message": "当前学生信息不存在，无法查询课程安排",
            "scheduleDate": schedule_date,
        }

    class_id = student["classId"]
    result = MOCK_CLASS_SCHEDULES.get((class_id, schedule_date))
    if result is None:
        return {
            "found": False,
            "message": "你所在班级当天暂时没有课程安排",
            "scheduleDate": schedule_date,
        }
    return result


def execute_tool_call(tool_call: Any) -> dict[str, Any]:
    function = tool_call.function
    name = function.name
    arguments = json.loads(function.arguments or "{}")

    if name == "get_student_day_schedule":
        return get_student_day_schedule(
            current_student_id=CURRENT_STUDENT_ID,
            date_text=str(arguments.get("date") or ""),
        )

    return {"found": False, "message": f"未知工具：{name}"}


def main() -> int:
    try:
        settings = get_settings()
    except ConfigError as exc:
        print(f"配置错误：{exc}")
        print("提示：复制 .env.example 为 .env，填入 DASHSCOPE_API_KEY")
        return 2

    question = os.getenv("TOOL_CALLING_QUESTION", "我明天有课吗？")
    client = OpenAI(api_key=settings.api_key, base_url=settings.base_url)

    messages: list[dict[str, Any]] = [
        {
            "role": "system",
            "content": (
                "你是学生端 AI 助手。今天是 2026-07-06。"
                "当学生询问某天课程安排时，必须调用 get_student_day_schedule 工具，"
                "不要猜测课程内容。工具返回没有安排时，直接说明没有课程安排。"
            ),
        },
        {"role": "user", "content": question},
    ]

    print(f"学生问题：{question}")
    print("第一轮：把工具定义交给模型，让模型决定是否调用工具")

    first_response = client.chat.completions.create(
        model=settings.model,
        messages=messages,
        tools=TOOLS,
        tool_choice="auto",
        temperature=0.2,
    )

    assistant_message = first_response.choices[0].message
    tool_calls = assistant_message.tool_calls or []
    if not tool_calls:
        print("模型没有调用工具，直接回答：")
        print(assistant_message.content or "")
        client.close()
        return 0

    messages.append(assistant_message.model_dump(exclude_none=True))

    print("模型生成的 tool_call：")
    for tool_call in tool_calls:
        print(
            json.dumps(
                {
                    "id": tool_call.id,
                    "name": tool_call.function.name,
                    "arguments": json.loads(tool_call.function.arguments or "{}"),
                },
                ensure_ascii=False,
                indent=2,
            )
        )

        tool_result = execute_tool_call(tool_call)
        print("程序执行工具结果：")
        print(json.dumps(tool_result, ensure_ascii=False, indent=2))

        messages.append(
            {
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(tool_result, ensure_ascii=False),
            }
        )

    print("第二轮：把工具结果交回模型，让模型组织最终回答")
    final_response = client.chat.completions.create(
        model=settings.model,
        messages=messages,
        temperature=0.2,
    )

    print("最终回答：")
    print(final_response.choices[0].message.content or "")
    client.close()
    return 0


if __name__ == "__main__":
    # 把 main() 返回的数字作为脚本退出码交给操作系统：
    # 0 表示正常结束，1 表示一般错误，2 表示配置或参数错误。
    sys.exit(main())
