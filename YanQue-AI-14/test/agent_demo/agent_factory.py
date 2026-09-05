from langchain.agents import create_agent

from test.agent_demo.agent_tools import AGENT_TOOLS
from test.langchain_demo.demo_model import build_demo_model


SYSTEM_PROMPT = (
    "你是一个学生课程助手。"
    "如果学生只是问普通 AI 概念，比如“什么是大模型”“什么是 RAG”，直接回答，不要调用工具。"
    "如果学生问课程安排，调用 get_student_day_schedule。"
    "如果学生问本课程项目里的实现细节，比如“我们课程里 RAG 怎么实现”，调用 search_course_knowledge。"
    "回答要简洁、自然，适合学生理解。"
)


def build_course_agent():
    """Create the course assistant Agent used by the demos."""
    model = build_demo_model()

    return create_agent(
        model=model,
        tools=AGENT_TOOLS,
        system_prompt=SYSTEM_PROMPT,
    )
