from langchain_core.messages import AIMessage, HumanMessage, RemoveMessage, trim_messages
from langgraph.graph.message import REMOVE_ALL_MESSAGES


def print_messages(title: str, messages):
    print("\n" + title)
    print("=" * 60)
    for index, message in enumerate(messages, start=1):
        print(f"{index}. {message.type}: {message.content}")


def main():
    messages = [
        HumanMessage(content="我叫小明。"),
        AIMessage(content="好的，我记住了。"),
        HumanMessage(content="我明天有什么课？"),
        AIMessage(content="明天晚上有 LangChain Agent 入门。"),
        HumanMessage(content="那我叫什么？"),
        AIMessage(content="你叫小明。"),
    ]

    print_messages("裁剪前的历史消息", messages)

    trimmed_messages = trim_messages(
        # 要裁剪的原始历史消息列表。
        messages,

        # 最多保留多少“计数单位”。
        # 这里配合 token_counter=len 使用，所以表示最多保留 4 条消息。
        max_tokens=4,

        # 按消息条数计算长度，不按真实 token 数计算。
        token_counter=len,

        # 保留最后面的消息，也就是最近的对话。
        strategy="last",

        # 裁剪后尽量从 human 消息开始，避免开头就是 AI 回答。
        start_on="human",
    )

    print_messages("只保留最近 4 条消息后", trimmed_messages)

    print("\n这一步和 checkpoint 的关系：")
    print("checkpoint 里保存的是当前对话的 messages。")
    print("trim_messages 只是把 messages 裁短。")
    print("如果把裁短后的 messages 写回 Agent 状态，下一次 checkpoint 保存的就是裁短后的历史。")

    updates_for_agent_state = [
        # 写回 Agent 的 messages 状态时，先清空旧消息。
        RemoveMessage(id=REMOVE_ALL_MESSAGES),

        # 再放入裁剪后的消息。
        *trimmed_messages,
    ]

    print("\n如果要写回 Agent 的 messages 状态，可以先清空旧消息，再放入裁剪后的消息：")
    print("RemoveMessage(id=REMOVE_ALL_MESSAGES)")
    for message in updates_for_agent_state[1:]:
        print(f"{message.type}: {message.content}")


if __name__ == "__main__":
    main()
