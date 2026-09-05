from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph


# 这个 demo 是一个综合练习：
# 先判断任务是否完成，再根据结果走“提醒”或“评分”分支。


class TaskState(TypedDict, total=False):
    task_name: str
    finished: bool
    score: int
    status: str
    message: str


def check_finished_node(state: TaskState) -> TaskState:
    # 第一个节点只判断任务有没有完成。
    if state["finished"]:
        status = "FINISHED"
    else:
        status = "NOT_FINISHED"

    return {
        "status": status
    }


def route_after_finished(state: TaskState) -> Literal["grade", "remind"]:
    # 这是条件边使用的路由函数。
    # 已完成 -> grade
    # 未完成 -> remind
    if state["status"] == "FINISHED":
        return "grade"
    return "remind"


def grade_node(state: TaskState) -> TaskState:
    # 已完成的任务进入评分节点。
    score = state["score"]

    if score >= 85:
        message = "作业完成得不错，可以进入下一节。"
    elif score >= 60:
        message = "作业已经完成，但建议订正错题。"
    else:
        message = "作业分数偏低，建议重新复习后再提交。"

    return {
        "message": message
    }


def remind_node(state: TaskState) -> TaskState:
    # 未完成的任务进入提醒节点。
    return {
        "message": f"你还没有完成《{state['task_name']}》，请先完成后再提交。"
    }


def build_graph():
    graph_builder = StateGraph(TaskState)

    graph_builder.add_node("check_finished", check_finished_node)
    graph_builder.add_node("grade", grade_node)
    graph_builder.add_node("remind", remind_node)

    graph_builder.add_edge(START, "check_finished")

    # check_finished 执行完后，不是固定进入某个节点，
    # 而是调用 route_after_finished 决定下一步。
    graph_builder.add_conditional_edges(
        "check_finished",
        route_after_finished,
        {
            "grade": "grade",
            "remind": "remind",
        },
    )
    graph_builder.add_edge("grade", END)
    graph_builder.add_edge("remind", END)

    return graph_builder.compile()


def main():
    graph = build_graph()

    cases = [
        {
            "task_name": "LangGraph 基础练习",
            "finished": False,
            "score": 0,
        },
        {
            "task_name": "LangGraph 基础练习",
            "finished": True,
            "score": 92,
        },
        {
            "task_name": "LangGraph 基础练习",
            "finished": True,
            "score": 55,
        },
    ]

    for case in cases:
        result = graph.invoke(case)

        print("=" * 60)
        print(f"任务：{result['task_name']}")
        print(f"是否完成：{result['finished']}")
        print(f"状态：{result['status']}")
        print(f"提示：{result['message']}")


if __name__ == "__main__":
    main()
