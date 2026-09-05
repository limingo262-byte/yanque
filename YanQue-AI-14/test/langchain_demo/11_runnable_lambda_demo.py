from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda

from demo_model import build_demo_model


def normalize_question(question: str) -> dict:
    clean_question = question.strip()
    return {
        "question": clean_question,
    }


def main():
    normalizer = RunnableLambda(normalize_question)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个 AI 课程助教。"),
            ("human", "请解释：{question}"),
        ]
    )
    model = build_demo_model()

    chain = normalizer | prompt | model | StrOutputParser()
    answer = chain.invoke("   什么是 RunnableLambda？   ")

    print(answer)


if __name__ == "__main__":
    main()
