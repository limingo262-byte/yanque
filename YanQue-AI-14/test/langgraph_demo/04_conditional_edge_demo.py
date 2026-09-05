from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph


# 这个 demo 重点看 Conditional Edge：
# grade 节点算出等级后，流程根据等级走到不同节点。


class ScoreState(TypedDict, total=False):
    student_name: str
    score: int
    level: str
    suggestion: str


def grade_node(state: ScoreState) -> ScoreState:
    # 这个节点只负责根据分数计算 level。
    score = state["score"]

    if score >= 90:
        level = "EXCELLENT"
    elif score >= 60:
        level = "PASS"
    else:
        level = "NEED_REVIEW"

    return {
        "level": level
    }


def choose_next_node(state: ScoreState) -> Literal["excellent", "pass_node", "need_review"]:
    # 这个函数不是普通节点。
    # 它专门给 add_conditional_edges 使用，用来决定下一步去哪个节点。
    level = state["level"]

    if level == "EXCELLENT":
        return "excellent"
    if level == "PASS":
        return "pass_node"
    return "need_review"


def excellent_node(state: ScoreState) -> ScoreState:
    # 这三个节点分别处理三种分支。
    return {
        "suggestion": "成绩很好，可以继续做进阶练习。"
    }


def pass_node(state: ScoreState) -> ScoreState:
    return {
        "suggestion": "已经及格，建议把错题重新做一遍。"
    }


def need_review_node(state: ScoreState) -> ScoreState:
    return {
        "suggestion": "基础还不稳，建议先复习核心概念。"
    }


def build_graph():
    graph_builder = StateGraph(ScoreState)

    # 先注册所有可能会执行到的节点。
    graph_builder.add_node("grade", grade_node)
    graph_builder.add_node("excellent", excellent_node)
    graph_builder.add_node("pass_node", pass_node)
    graph_builder.add_node("need_review", need_review_node)

    graph_builder.add_edge(START, "grade")

    # add_conditional_edges 表示条件边。
    # grade 执行完后，LangGraph 会调用 choose_next_node。
    # choose_next_node 返回哪个 key，就进入映射表里对应的节点。
    graph_builder.add_conditional_edges(
        "grade",
        choose_next_node,
        {
            "excellent": "excellent",
            "pass_node": "pass_node",
            "need_review": "need_review",
        },
    )
    graph_builder.add_edge("excellent", END)
    graph_builder.add_edge("pass_node", END)
    graph_builder.add_edge("need_review", END)

    return graph_builder.compile()


def main():
    graph = build_graph()

    for score in [95, 72, 48]:
        result = graph.invoke({
            "student_name": "小明",
            "score": score,
        })

        print("=" * 50)
        print(f"分数：{score}")
        print(f"等级：{result['level']}")
        print(f"建议：{result['suggestion']}")


if __name__ == "__main__":
    main()
