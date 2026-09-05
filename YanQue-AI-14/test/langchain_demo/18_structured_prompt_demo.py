from pydantic import BaseModel, Field

from langchain_core.prompts.structured import StructuredPrompt
from demo_model import build_demo_model


class CourseConcept(BaseModel):
    name: str = Field(description="概念名称")
    explanation: str = Field(description="适合初学者理解的解释")
    example: str = Field(description="一个简单例子")


def main():
    prompt = StructuredPrompt.from_messages_and_schema(
        [
            (
                "system",
                "你是一个 AI 课程助教。请严格按 JSON 输出，不要输出多余解释。",
            ),
            (
                "human",
                "请解释这个概念：{concept}。",
            ),
        ],
        schema=CourseConcept,
    )
    messages = prompt.invoke({"concept": "LangChain"})

    print("StructuredPrompt 仍然可以生成 messages：")
    for message in messages.to_messages():
        print(f"{message.type}: {message.content}")
    print()

    print("它额外绑定了一个输出结构：")
    print(prompt.schema_)
    print()

    model = build_demo_model()
    structured_model = model.with_structured_output(CourseConcept)
    answer = structured_model.invoke(messages.to_messages())

    print("使用 model.with_structured_output(CourseConcept) 后：")
    print(type(answer))
    print(answer)
    print()

    print("解析成 Python 对象以后，可以直接读取字段：")
    print("name:", answer.name)
    print("explanation:", answer.explanation)
    print("example:", answer.example)
    print()

    chain_answer = (prompt | model).invoke({"concept": "LangChain"})

    print("StructuredPrompt 也可以这样使用：prompt | model")
    print(type(chain_answer))
    print(chain_answer)


if __name__ == "__main__":
    main()
