from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnablePassthrough

from demo_model import build_demo_model


def search_knowledge(question: str) -> str:
    if "RAG" in question:
        return (
            "[资料1]\n"
            "文档：第三天_RAG知识库问答入门.md\n"
            "内容：RAG 会先检索资料，再把资料和用户问题一起交给大模型。"
        )
    return "知识库中没有找到明确相关资料。"


def main():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个 AI 课程助教。请优先依据资料回答。"),
            ("system", "知识库资料：\n{context}"),
            ("human", "{question}"),
        ]
    )
    model = build_demo_model()

    chain = (
        RunnableParallel(
            {
                "question": RunnablePassthrough(),
                "context": RunnableLambda(search_knowledge),
            }
        )
        | prompt
        | model
        | StrOutputParser()
    )

    answer = chain.invoke("什么是 RAG？")

    print(answer)


if __name__ == "__main__":
    main()
