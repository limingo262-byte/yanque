from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from demo_model import build_demo_model


def build_demo_history():
    return [
        HumanMessage(content="我刚才问过什么是 RAG。"),
        AIMessage(content="RAG 是检索增强生成。"),
    ]


def build_prompt():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个 AI 课程助教。"),
            MessagesPlaceholder("history"),
            ("human", "{question}"),
        ]
    )
    return prompt


def test_messages_placeholder_format():
    """
    演示 MessagesPlaceholder 只是 Prompt 里的占位符。
    它不会保存历史，只负责把调用时传入的 history 插入到 messages 里。
    """

    prompt = build_prompt()
    messages = prompt.invoke(
        {
            "history": build_demo_history(),
            "question": "那它为什么要先检索资料？",
        }
    )

    print("MessagesPlaceholder 插入后的完整 messages：")
    for index, message in enumerate(messages.to_messages(), start=1):
        print(f"{index}. {message.type}: {message.content}")


def demo_messages_placeholder_chain():
    """真实链路：Prompt + history + Model + StrOutputParser。"""

    prompt = build_prompt()
    model = build_demo_model()

    chain = prompt | model | StrOutputParser()
    answer = chain.invoke(
        {
            "history": build_demo_history(),
            "question": "那它为什么要先检索资料？",
        }
    )

    print(answer)


def main():
    test_messages_placeholder_format()

    # 这一段会真实调用大模型。课堂上如果已经配置 .env，可以取消注释运行。
    # demo_messages_placeholder_chain()


if __name__ == "__main__":
    main()
