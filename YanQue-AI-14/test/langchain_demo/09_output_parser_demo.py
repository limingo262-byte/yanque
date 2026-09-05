import json

from langchain_core.exceptions import OutputParserException
from langchain_core.output_parsers import (
    CommaSeparatedListOutputParser,
    JsonOutputParser,
    PydanticOutputParser,
    StrOutputParser,
)
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from demo_model import build_demo_model


class CourseConcept(BaseModel):
    name: str = Field(description="概念名称")
    explanation: str = Field(description="适合初学者理解的解释")
    example: str = Field(description="一个简单例子")


def print_title(title: str):
    print()
    print("=" * 80)
    print(title)
    print("=" * 80)


def demo_str_output_parser():
    """把模型文本输出整理成普通字符串。"""

    print_title("1. StrOutputParser：提取纯文本")

    parser = StrOutputParser()
    model_output = "StrOutputParser 会把模型输出整理成普通字符串。"
    result = parser.invoke(model_output)

    print(type(result))
    print(result)


def demo_json_output_parser():
    """把模型返回的 JSON 字符串解析成 dict。"""

    print_title("2. JsonOutputParser：解析 JSON 为 dict")

    parser = JsonOutputParser()
    model_output = """
```json
{
  "name": "RAG",
  "type": "检索增强生成",
  "steps": ["加载文档", "切分", "向量化", "检索", "生成回答"]
}
```
"""
    result = parser.invoke(model_output)

    print(type(result))
    print(result)
    print("name:", result["name"])
    print("steps:", result["steps"])


def demo_comma_separated_list_output_parser():
    """把逗号分隔文本解析成 list。"""

    print_title("3. CommaSeparatedListOutputParser：解析逗号分隔列表")

    parser = CommaSeparatedListOutputParser()
    model_output = "LangChain, RAG, Agent, LangGraph"
    result = parser.invoke(model_output)

    print(type(result))
    print(result)


def demo_pydantic_output_parser():
    """按 Pydantic 模型解析并校验字段类型。"""

    print_title("4. PydanticOutputParser：解析并校验为 Pydantic 对象")

    parser = PydanticOutputParser(pydantic_object=CourseConcept)
    model_output = """
{
  "name": "Output Parser",
  "explanation": "把大模型的原始输出转换成业务代码需要的结构。",
  "example": "把 JSON 字符串解析成 Python 对象后再入库。"
}
"""
    result = parser.invoke(model_output)

    print(type(result))
    print(result)
    print("name:", result.name)
    print("explanation:", result.explanation)
    print("example:", result.example)


def demo_format_instructions():
    """Parser 可以生成格式提示词，放进 Prompt 约束模型输出。"""

    print_title("5. get_format_instructions：把输出格式要求放进 Prompt")

    parser = PydanticOutputParser(pydantic_object=CourseConcept)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个 AI 课程助教。请严格按指定格式输出。"),
            (
                "human",
                "请解释概念：{concept}\n\n{format_instructions}",
            ),
        ]
    )

    messages = prompt.invoke(
        {
            "concept": "LangChain",
            "format_instructions": parser.get_format_instructions(),
        }
    )

    print("最终发给模型的 messages：")
    for message in messages.to_messages():
        print(f"{message.type}: {message.content}")





def demo_chain_with_parser():
    """真实链式写法模板：Prompt | Model | Parser。需要 .env 配置 API Key。"""

    print_title("7. Prompt | Model | Parser：真实链式写法模板")

    parser = PydanticOutputParser(pydantic_object=CourseConcept)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "你是一个 AI 课程助教。请严格按格式输出。"),
            (
                "human",
                "请解释概念：{concept}\n\n{format_instructions}",
            ),
        ]
    )
    model = build_demo_model()
    chain = prompt | model | parser

    result = chain.invoke(
        {
            "concept": "Output Parser",
            "format_instructions": parser.get_format_instructions(),
        }
    )

    print(type(result))
    print(result)


def main():
    #demo_str_output_parser()
    #demo_json_output_parser()
    #demo_comma_separated_list_output_parser()
    #demo_pydantic_output_parser()
    demo_format_instructions()

    # 这一段会真实调用大模型。课堂上如果已经配置 .env，可以取消注释运行。
    # demo_chain_with_parser()


if __name__ == "__main__":
    main()
