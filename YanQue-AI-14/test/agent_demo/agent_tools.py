from langchain_core.tools import tool


@tool
def get_student_day_schedule(date: str) -> str:
    """查询当前登录学生在指定日期的课程安排，date 格式为 yyyy-MM-dd。"""
    if date == "2026-07-09":
        return "2026-07-09 19:00-21:00 有《LangChain Agent 入门》课程。"

    return f"{date} 暂未查询到课程安排。"


@tool
def search_course_knowledge(question: str) -> str:
    """查询本课程项目的实现资料。只适合回答“我们课程里怎么实现”“项目代码怎么做”“课程资料里怎么讲”的问题。"""
    if "RAG" in question or "rag" in question:
        return (
            "课程里的 RAG 实现流程是："
            "先把课程资料切成 chunk，使用 embedding 模型转成向量，"
            "再存入 Milvus。学生提问时，Python 服务会根据问题去 Milvus 检索相关 chunk，"
            "然后把检索结果拼进 Prompt，最后交给大模型生成回答。"
        )

    return "知识库中暂时没有找到相关课程资料。"


AGENT_TOOLS = [
    get_student_day_schedule,
    search_course_knowledge,
]
