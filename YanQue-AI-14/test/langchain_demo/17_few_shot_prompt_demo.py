from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate


def main():
    examples = [
        {
            "question": "什么是 RAG？",
            "answer": "RAG 是先检索资料，再让模型基于资料回答。",
        },
        {
            "question": "什么是 Tool？",
            "answer": "Tool 是可以交给 AI 调用的业务能力。",
        },
    ]

    example_prompt = ChatPromptTemplate.from_messages(
        [
            ("human", "{question}"),
            ("ai", "{answer}"),
        ]
    )

    few_shot_prompt = FewShotChatMessagePromptTemplate(
        examples=examples,
        example_prompt=example_prompt,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个 AI 课程助教，请模仿示例的简洁风格回答。"),
            few_shot_prompt,
            ("human", "{question}"),
        ]
    )

    messages = prompt.invoke({"question": "什么是 LangChain？"})

    print("FewShot 会把示例问答放进 messages：")
    for message in messages.to_messages():
        print(f"{message.type}: {message.content}")


if __name__ == "__main__":
    main()
