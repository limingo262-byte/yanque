from langchain.agents import create_agent
from langchain_core.tools import tool

from test.agent_demo.message_printer import print_agent_messages
from test.langchain_demo.demo_model import build_demo_model


@tool
def get_student_day_schedule(date: str) -> str:
    """查询当前登录学生在指定日期的课程安排，date 格式为 yyyy-MM-dd。"""
    if date == "2026-07-09":
        return "2026-07-09 19:00-21:00 的课程是《LangChain Agent 入门》。"

    return f"{date} 暂未查询到课程安排。"


@tool
def get_lesson_detail(lesson_name: str) -> str:
    """根据课程名称查询课程详情。只有已经知道具体课程名称后，才适合调用这个工具。"""
    if "LangChain Agent" in lesson_name:
        return (
            "《LangChain Agent 入门》主要讲："
            "Agent 和普通 Chain 的区别，"
            "模型如何产生 tool_calls，"
            "Agent 如何执行工具并把结果交回模型，"
            "以及学生课程助手的多工具调用示例。"
        )

    return f"暂未找到 {lesson_name} 的课程详情。"


def main():
    model = build_demo_model()

    agent = create_agent(
        model=model,
        tools=[
            get_student_day_schedule,
            get_lesson_detail,
        ],
        system_prompt=(
            "你是一个学生课程助手。"
            "如果学生问某一天课程的具体内容，先调用 get_student_day_schedule 查询当天课程。"
            "拿到课程名称以后，再调用 get_lesson_detail 查询这节课主要讲什么。"
            "最后用简洁自然的话回答学生。"
        ),
    )

    result = agent.invoke({
        "messages": [
            {
                "role": "user",
                "content": "我明天这节课主要讲什么？明天是 2026-07-09。",
            }
        ]
    })

    print_agent_messages(result["messages"])

    print("=" * 60)
    print("最终回答：")
    print(result["messages"][-1].content)


if __name__ == "__main__":
    main()
