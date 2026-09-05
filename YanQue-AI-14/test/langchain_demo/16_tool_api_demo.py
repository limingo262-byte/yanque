import os

from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.tools import tool

from demo_model import build_demo_model


@tool
def get_student_day_schedule(date: str) -> str:
    """查询当前登录学生在指定日期的课程安排，date 格式为 yyyy-MM-dd。"""
    if date == "2026-07-06":
        return "2026-07-06 的课程是 LangChain 框架实战。"
    return f"{date} 暂未查询到课程安排。"


def main():
    print("工具名称：")
    print(get_student_day_schedule.name)
    print()

    print("工具说明：")
    print(get_student_day_schedule.description)
    print()

    print("工具参数结构：")
    print(get_student_day_schedule.args)
    print()

    print("直接调用工具：")
    result = get_student_day_schedule.invoke({"date": "2026-07-06"})
    print(result)
    print()



    print("让大模型决定是否调用工具：")
    model = build_demo_model()
    model_with_tools = model.bind_tools([get_student_day_schedule])

    question = "帮我查一下 2026-07-06 我有什么课？"
    ai_message = model_with_tools.invoke(question)

    print("模型第一次返回：")
    print(ai_message)
    print()

    print("模型想调用的工具：")
    print(ai_message.tool_calls)
    print()

    # 注意：大模型不会真的执行 Python 函数。
    # 它只会告诉程序：我想调用哪个工具，以及参数是什么。
    # 真正执行工具的是我们自己的 Python 代码。
    tool_map = {
        get_student_day_schedule.name: get_student_day_schedule,
    }

    messages = [
        HumanMessage(content=question),
        ai_message,
    ]

    for tool_call in ai_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]

        selected_tool = tool_map[tool_name]
        tool_result = selected_tool.invoke(tool_args)

        print("程序执行工具：")
        print(f"工具名：{tool_name}")
        print(f"参数：{tool_args}")
        print(f"结果：{tool_result}")
        print()

        messages.append(
            ToolMessage(
                content=str(tool_result),
                tool_call_id=tool_id,
            )
        )

    final_message = model_with_tools.invoke(messages)

    print("把工具结果交回模型以后，模型最终回答：")
    print(final_message.content)


if __name__ == "__main__":
    main()
