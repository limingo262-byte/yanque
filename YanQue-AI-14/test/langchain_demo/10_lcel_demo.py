from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from demo_model import build_demo_model


def main():
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个 AI 课程助教。"),
            ("human", "请用一句话解释：{question}"),
        ]
    )
    model = build_demo_model()

    chain = prompt | model | StrOutputParser()
    answer = chain.invoke({"question": "LCEL 是什么？"})

    print("LCEL 链式写法：")
    print("prompt | model | StrOutputParser()")
    print()
    print("运行结果：")
    print(answer)


if __name__ == "__main__":
    main()
