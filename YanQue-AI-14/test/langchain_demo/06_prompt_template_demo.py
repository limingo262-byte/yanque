from langchain_core.prompts import ChatPromptTemplate


def main():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个耐心、专业的 AI 课程助教。"),
            ("human", "请用{style}的方式解释：{question}"),
        ]
    )

    messages = prompt.invoke(
        {
            "style": "适合初学者理解",
            "question": "什么是 RAG？",
        }
    )

    print("ChatPromptTemplate 会把变量填入 messages：")
    for message in messages.to_messages():
        print(f"{message.type}: {message.content}")


if __name__ == "__main__":
    main()
