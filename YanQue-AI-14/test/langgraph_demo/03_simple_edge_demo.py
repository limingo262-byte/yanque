from typing import TypedDict

from langgraph.graph import END, START, StateGraph


# 这个 demo 重点看 Edge：
# 多个节点可以按固定顺序一步一步执行。


class ArticleState(TypedDict, total=False):
    topic: str
    title: str
    outline: list[str]
    summary: str


def create_title_node(state: ArticleState) -> ArticleState:
    # 第一步：根据 topic 生成标题。
    topic = state["topic"]
    return {
        "title": f"{topic} 入门说明"
    }


def create_outline_node(state: ArticleState) -> ArticleState:
    # 第二步：生成提纲。
    return {
        "outline": [
            "先说明它解决什么问题",
            "再解释核心概念",
            "最后给一个简单例子",
        ]
    }


def create_summary_node(state: ArticleState) -> ArticleState:
    # 第三步：读取前两个节点写入的 title 和 outline，生成最终摘要。
    title = state["title"]
    outline = state["outline"]

    return {
        "summary": f"标题：{title}\n提纲：" + "；".join(outline)
    }


def build_graph():
    graph_builder = StateGraph(ArticleState)

    # 先注册节点。
    graph_builder.add_node("create_title", create_title_node)
    graph_builder.add_node("create_outline", create_outline_node)
    graph_builder.add_node("create_summary", create_summary_node)

    # 再用普通 edge 串成固定流程。
    graph_builder.add_edge(START, "create_title")
    graph_builder.add_edge("create_title", "create_outline")
    graph_builder.add_edge("create_outline", "create_summary")
    graph_builder.add_edge("create_summary", END)

    return graph_builder.compile()


def main():
    graph = build_graph()

    result = graph.invoke({
        "topic": "LangGraph"
    })

    print(result["summary"])
    print()
    print("说明：")
    print("这个 demo 主要看 Edge。")
    print("流程按 create_title -> create_outline -> create_summary 的顺序执行。")


if __name__ == "__main__":
    main()
