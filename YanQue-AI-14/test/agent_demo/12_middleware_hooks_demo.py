from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware

from test.agent_demo.message_printer import print_final_answer
from test.langchain_demo.demo_model import build_demo_model


class LoggingMiddleware(AgentMiddleware):
    """Print when common Agent middleware hooks run."""

    def before_agent(self, state, runtime):
        print("[before_agent] Agent 准备开始运行。")
        print("[before_agent] 当前 messages 数量：", len(state["messages"]))
        return None

    def before_model(self, state, runtime):
        print("[before_model] 模型调用前。")
        print("[before_model] 模型即将看到的 messages 数量：", len(state["messages"]))
        return None

    def after_model(self, state, runtime):
        print("[after_model] 模型调用后。")
        print("[after_model] 当前 messages 数量：", len(state["messages"]))
        return None

    def after_agent(self, state, runtime):
        print("[after_agent] Agent 即将结束。")
        print("[after_agent] 最终 messages 数量：", len(state["messages"]))
        return None


def main():
    model = build_demo_model()

    agent = create_agent(
        model=model,
        tools=[],
        system_prompt="你是一个学生课程助手，回答要简洁。",
        middleware=[
            LoggingMiddleware(),
        ],
    )

    result = agent.invoke({
        "messages": [
            {
                "role": "user",
                "content": "什么是 Agent？",
            }
        ]
    })

    print("\n最终回答：")
    print_final_answer(result)


if __name__ == "__main__":
    main()
