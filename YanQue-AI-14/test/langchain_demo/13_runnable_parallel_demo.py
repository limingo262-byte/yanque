from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnablePassthrough


def search_knowledge(question: str) -> str:
    if "RAG" in question:
        return "资料：RAG 会先检索知识库资料，再让模型结合资料回答。"
    return "资料：知识库里没有找到明确内容。"


def main():
    parallel = RunnableParallel(
        {
            "question": RunnablePassthrough(),
            "context": RunnableLambda(search_knowledge),
        }
    )

    result = parallel.invoke("什么是 RAG？")

    print("RunnableParallel 会同时准备多个变量：")
    print(result)


if __name__ == "__main__":
    main()
