from langchain_core.prompts import ChatPromptTemplate

from demo_model import build_demo_model


def main():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个 AI 课程助教。"),
            ("human", "请解释：{question}"),
        ]
    )
    model = build_demo_model()

    chain = prompt | model
    response = chain.invoke({"question": "什么是 RAG？"})

    print("Prompt | Model 的返回值还是 AIMessage：")
    print(response)
    print()
    print("回答文本：")
    print(response.content)


if __name__ == "__main__":
    main()
