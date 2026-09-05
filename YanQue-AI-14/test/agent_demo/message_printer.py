def print_final_answer(result: dict):
    """Print only the final answer from an Agent result."""
    print(result["messages"][-1].content)


def print_agent_messages(messages):
    """Print the Agent message list in a beginner-friendly way."""
    for index, message in enumerate(messages, start=1):
        print("=" * 60)
        message_type = message.type
        print(f"第 {index} 条消息：{message_type}")

        if message_type == "human":
            print("用户问题：")
            print(message.content)

        elif message_type == "ai":
            if getattr(message, "tool_calls", None):
                print("模型决定调用工具：")
                for tool_call in message.tool_calls:
                    print("工具名：", tool_call["name"])
                    print("参数：", tool_call["args"])
            elif message.content:
                print("模型回答：")
                print(message.content)

        elif message_type == "tool":
            print("工具返回结果：")
            print(message.content)

        else:
            print("消息内容：")
            print(message)
