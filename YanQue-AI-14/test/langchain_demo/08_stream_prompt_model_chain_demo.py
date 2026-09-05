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

    print("Prompt | Model 也可以流式输出：")
    print()

    for chunk in chain.stream({"question": "什么是 RAG？"}):
        # 这里的 chunk 是 AIMessageChunk。
        # 真正要显示给用户看的文本在 chunk.content 里面。
        print(chunk.content, end="", flush=True)

    print()


if __name__ == "__main__":
    main()
