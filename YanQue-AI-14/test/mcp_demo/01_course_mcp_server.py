from typing import Any

from mcp.server.fastmcp import FastMCP


# FastMCP 用来快速创建一个 MCP Server。
# "yanque-course-demo" 是这个 MCP Server 的名字，方便客户端识别。
mcp = FastMCP(
    "yanque-course-demo",
    host="127.0.0.1",
    port=8010,
    streamable_http_path="/mcp",
)


# 课堂 demo 先用内存数据模拟课程表。
# 真实项目里，这里可以换成调用 YanQue 后端 API 或数据库查询。
COURSES: dict[str, dict[str, Any]] = {
    "langchain": {
        "id": "langchain",
        "name": "LangChain 框架实战",
        "teacher": "燕雀 AI 教研组",
        "date": "2026-07-06",
        "summary": "学习模型调用、提示词模板、工具调用和 Agent 基础流程。",
    },
    "mcp": {
        "id": "mcp",
        "name": "MCP 服务开发入门",
        "teacher": "燕雀 AI 教研组",
        "date": "2026-07-23",
        "summary": "学习 MCP Server 如何把工具暴露给 MCP Client 和 Agent。",
    },
}


@mcp.tool()
def query_course(keyword: str) -> list[dict[str, Any]]:
    """按课程 ID、课程名或简介关键词查询课程。"""
    normalized_keyword = keyword.strip().lower()
    if not normalized_keyword:
        return []

    return [
        course
        for course in COURSES.values()
        if normalized_keyword in course["id"].lower()
        or normalized_keyword in course["name"].lower()
        or normalized_keyword in course["summary"].lower()
    ]


@mcp.resource("yanque://course/{course_id}", mime_type="application/json")
def get_course(course_id: str) -> dict[str, Any]:
    """读取指定课程的完整资料。"""
    course = COURSES.get(course_id)
    if course is None:
        return {
            "error": "COURSE_NOT_FOUND",
            "message": f"未找到课程：{course_id}",
        }
    return course


@mcp.resource("yanque://course/catalog", mime_type="application/json")
def get_course_catalog() -> list[dict[str, str]]:
    """读取固定课程目录。"""
    return [
        {
            "id": course["id"],
            "name": course["name"],
            "date": course["date"],
        }
        for course in COURSES.values()
    ]


@mcp.prompt()
def course_study_plan(course_name: str, student_level: str = "初学者") -> str:
    """生成课程学习计划提示词。"""
    return f"""
你是燕雀 AI 课程助教，请为 {student_level} 学员制定《{course_name}》学习计划。

要求：
1. 说明这门课适合解决什么问题。
2. 按课前、课中、课后三个阶段安排学习任务。
3. 给出 3 个可实践的小练习。
4. 提醒学员容易踩坑的地方。
""".strip()


if __name__ == "__main__":
    # 本节统一使用 streamable-http。
    # 启动后，MCP Client / LangChain / Agent 都通过 http://127.0.0.1:8010/mcp 连接它。
    mcp.run(transport="streamable-http")
