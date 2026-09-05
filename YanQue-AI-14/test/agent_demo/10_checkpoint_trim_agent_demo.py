from langchain.agents import create_agent
from langchain.agents.middleware import AgentMiddleware
from langchain_core.messages import RemoveMessage, trim_messages
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph.message import REMOVE_ALL_MESSAGES

from test.agent_demo.message_printer import print_agent_messages
from test.langchain_demo.demo_model import build_demo_model


class KeepRecentMessagesMiddleware(AgentMiddleware):
    """Trim checkpoint-loaded messages before each model call."""

    def __init__(self, max_messages: int = 4):
        self.max_messages = max_messages

    def before_model(self, state, runtime):
        messages = state["messages"]

        trimmed_messages = trim_messages(
            # 这里拿到的是 Agent 当前状态里的 messages。
            # 如果配置了 checkpointer，同一个 thread_id 的历史消息会先被读出来。
            messages,

            # 这里配合 token_counter=len 使用，表示最多保留几条消息。
            max_tokens=self.max_messages,

            # 按消息条数计算长度，不按真实 token 数计算。
            token_counter=len,

            # 保留最近的消息。
            strategy="last",

            # 裁剪后尽量从 human 消息开始。
            start_on="human",
        )

        if len(trimmed_messages) == len(messages):
            return None

        print()
        print("[middleware] 历史消息太多，准备裁剪。")
        print(f"[middleware] 裁剪前：{len(messages)} 条")
        print(f"[middleware] 裁剪后：{len(trimmed_messages)} 条")

        return {
            "messages": [
                # 先删除 Agent 状态里的旧 messages。
                RemoveMessage(id=REMOVE_ALL_MESSAGES),

                # 再写入裁剪后的 messages。
                # 这次 Agent 运行结束后，checkpointer 保存的就是裁剪后的状态。
                *trimmed_messages,
            ]
        }


def invoke_and_print(agent, content: str, config: dict):
    print("\n" + "=" * 60)
    print("用户问题：", content)

    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": content,
                }
            ]
        },
        config=config,
    )

    print("\n当前 checkpoint 对应的 messages：")
    print_agent_messages(result["messages"])

    return result


def main():
    model = build_demo_model()
    checkpointer = InMemorySaver()

    agent = create_agent(
        model=model,
        tools=[],
        system_prompt="你是一个学生课程助手，回答要简洁自然。",
        checkpointer=checkpointer,
        middleware=[
            # 模型调用前，只保留同一个 thread_id 下最近 4 条历史消息。
            KeepRecentMessagesMiddleware(max_messages=4)
        ],
    )

    config = {
        "configurable": {
            "thread_id": "student-1001"
        }
    }

    questions = [
        "我叫小明。",
        "我喜欢看代码示例。",
        "我明天有什么课？",
        "刚才我说我喜欢什么？",
    ]

    for question in questions:
        invoke_and_print(agent, question, config)

    print("\n结论：")
    print("1. checkpointer 会按 thread_id 保存历史 messages。")
    print("2. middleware 会在模型调用前裁剪 messages。")
    print("3. 裁剪后的 messages 会写回 Agent 状态。")
    print("4. 本次运行结束后，checkpoint 保存的就是裁剪后的历史。")


if __name__ == "__main__":
    main()
