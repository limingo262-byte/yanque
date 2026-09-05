from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware
from langchain_core.messages import ToolMessage
from langchain_core.tools import tool

from test.agent_demo.message_printer import print_agent_messages, print_final_answer
from test.langchain_demo.demo_model import build_demo_model


@tool
def unstable_schedule_tool(date: str) -> str:
    """查询课程安排的示例工具。这个工具故意抛异常，用来演示 wrap_tool_call 怎么兜底。"""
    raise RuntimeError(f"课程服务暂时不可用，date={date}")


class ToolErrorMiddleware(AgentMiddleware):
    """Catch tool errors and return a friendly ToolMessage."""

    def wrap_tool_call(self, request, handler):
        print("[wrap_tool_call] 工具真正执行前，可以先做日志、权限检查、参数检查。")
        print("[wrap_tool_call] 工具名：", request.tool_call["name"])
        print("[wrap_tool_call] 工具参数：", request.tool_call["args"])

        try:
            # 调用 handler(request)，才会真正执行原来的工具。
            return handler(request)
        except Exception as exc:
            print("[wrap_tool_call] 工具报错了，middleware 接住异常。")

            return ToolMessage(
                content=f"课程查询工具暂时失败，请稍后再试。错误信息：{exc}",
                tool_call_id=request.tool_call["id"],
            )


def main():
    model = build_demo_model()

    agent = create_agent(
        model=model,
        tools=[unstable_schedule_tool],
        system_prompt=(
            "你是一个学生课程助手。"
            "当学生询问课程安排时，请调用 unstable_schedule_tool。"
            "如果工具返回失败信息，请用自然语言安抚学生。"
        ),
        middleware=[
            ToolErrorMiddleware(),
        ],
    )

    result = agent.invoke({
        "messages": [
            {
                "role": "user",
                "content": "我明天有什么课？明天是 2026-07-09。",
            }
        ]
    })

    print("\nAgent 中间消息：")
    print_agent_messages(result["messages"])

    print("\n最终回答：")
    print_final_answer(result)


if __name__ == "__main__":
    main()
