from pydantic import BaseModel, Field

from langchain.agents import create_agent
from langchain_core.output_parsers import PydanticOutputParser

from test.agent_demo.agent_tools import AGENT_TOOLS
from test.agent_demo.message_printer import print_final_answer
from test.langchain_demo.demo_model import build_demo_model


class StudentQuestionResult(BaseModel):
    """Agent final result for program-side processing."""

    intent: str = Field(description="问题意图，例如 concept、schedule、course_knowledge")
    need_tool: bool = Field(description="回答这个问题是否需要调用工具")
    answer: str = Field(description="给学生看的最终回答")


def main():
    model = build_demo_model()

    # 先让 Agent 正常完成“判断问题 -> 调用工具 -> 组织回答”的流程。
    #
    # 说明：
    # LangChain 的 create_agent(response_format=...) 在部分 OpenAI 兼容模型服务上
    # 可能会触发 tool_choice=required，而百炼 thinking mode 当前不支持这种参数。
    # 所以这个课堂 demo 使用更兼容的两段式写法：
    # 1. Agent 先拿到最终自然语言回答。
    # 2. 再用 PydanticOutputParser 把最终回答整理成固定字段。
    agent = create_agent(
        model=model,
        tools=AGENT_TOOLS,
        system_prompt=(
            "你是一个学生课程助手。"
            "如果学生问课程安排，可以调用 get_student_day_schedule。"
            "如果学生问课程项目实现，可以调用 search_course_knowledge。"
            "回答要简洁自然。"
        ),
    )

    result = agent.invoke({
        "messages": [
            {
                "role": "user",
                "content": "我明天有什么课？明天是 2026-07-09。",
            }
        ]
    })

    print("普通 messages 里仍然有对话过程：")
    for message in result["messages"]:
        print(message.type, message.content)

    print("\nAgent 最终自然语言回答：")
    print_final_answer(result)

    final_answer = result["messages"][-1].content
    used_tool = any(message.type == "tool" for message in result["messages"])

    parser = PydanticOutputParser(pydantic_object=StudentQuestionResult)
    structured_message = model.invoke(
        [
            {
                "role": "system",
                "content": (
                    "请把学生问题和 Agent 回答整理成结构化结果。\n"
                    "intent 可选 concept、schedule、course_knowledge、other。\n"
                    "need_tool 必须根据“Agent 是否实际调用过工具”填写。\n"
                    "必须严格按照下面的格式要求输出，不要输出多余解释。\n"
                    f"{parser.get_format_instructions()}"
                ),
            },
            {
                "role": "user",
                "content": (
                    "学生问题：我明天有什么课？明天是 2026-07-09。\n"
                    f"Agent 是否实际调用过工具：{used_tool}\n"
                    f"Agent 回答：{final_answer}"
                ),
            },
        ]
    )

    structured_response = parser.parse(structured_message.content)

    print("\n结构化结果：")
    print(type(structured_response))
    print(structured_response)

    print("\n程序可以直接读取字段：")
    print("intent:", structured_response.intent)
    print("need_tool:", structured_response.need_tool)
    print("answer:", structured_response.answer)


if __name__ == "__main__":
    main()
