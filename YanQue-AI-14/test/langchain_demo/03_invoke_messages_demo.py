from langchain_core.messages import HumanMessage, SystemMessage

from demo_model import build_demo_model


def main():
    model = build_demo_model()

    messages = [
        SystemMessage(content="你是一个耐心、专业的 AI 课程助教。"),
        HumanMessage(content="请解释一下什么是 LangChain。"),
    ]

    response = model.invoke(messages)

    print("传入 messages 调用模型：")
    for message in messages:
        print(f"{message.type}: {message.content}")
    print()

    print("模型回答：")
    print(response.content)


if __name__ == "__main__":
    main()
