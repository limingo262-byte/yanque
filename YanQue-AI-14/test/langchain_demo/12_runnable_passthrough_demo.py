from langchain_core.runnables import RunnablePassthrough


def main():
    passthrough = RunnablePassthrough()

    question = "什么是 RAG？"
    result = passthrough.invoke(question)

    print("RunnablePassthrough 会原样传递输入：")
    print(result)


if __name__ == "__main__":
    main()
