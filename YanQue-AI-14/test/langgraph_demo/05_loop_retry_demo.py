from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph


# 这个 demo 重点看循环：
# 草稿不合格 -> retry -> 回到 write_draft 重新生成。


class RetryState(TypedDict, total=False):
    draft: str
    retry_count: int
    passed: bool
    final_message: str


def write_draft_node(state: RetryState) -> RetryState:
    # retry_count 用来记录已经重试了几次。
    # 第一次写一个很短的草稿，故意让它不通过检查。
    retry_count = state.get("retry_count", 0)

    if retry_count == 0:
        draft = "LangGraph 是一个框架。"
    else:
        draft = "LangGraph 是一个用图来组织 AI 流程的框架，可以把任务拆成节点和边。"

    return {
        "draft": draft
    }


def check_draft_node(state: RetryState) -> RetryState:
    # 检查草稿里是否同时出现“节点”和“边”。
    # 这里用简单规则模拟真实项目里的校验逻辑。
    draft = state["draft"]
    passed = "节点" in draft and "边" in draft

    return {
        "passed": passed
    }


def choose_next_node(state: RetryState) -> Literal["finish", "retry"]:
    # 检查通过就结束；不通过就进入 retry 节点。
    if state["passed"]:
        return "finish"
    return "retry"


def retry_node(state: RetryState) -> RetryState:
    # retry 节点只做一件事：把 retry_count 加 1。
    # 后面会回到 write_draft，重新生成草稿。
    retry_count = state.get("retry_count", 0)

    return {
        "retry_count": retry_count + 1
    }


def finish_node(state: RetryState) -> RetryState:
    return {
        "final_message": f"通过检查，最终草稿：{state['draft']}"
    }


def build_graph():
    graph_builder = StateGraph(RetryState)

    graph_builder.add_node("write_draft", write_draft_node)
    graph_builder.add_node("check_draft", check_draft_node)
    graph_builder.add_node("retry", retry_node)
    graph_builder.add_node("finish", finish_node)

    graph_builder.add_edge(START, "write_draft")
    graph_builder.add_edge("write_draft", "check_draft")
    graph_builder.add_conditional_edges(
        "check_draft",
        choose_next_node,
        {
            "finish": "finish",
            "retry": "retry",
        },
    )

    # 这里是循环的关键：
    # retry 执行完后，不是结束，而是回到 write_draft。
    graph_builder.add_edge("retry", "write_draft")
    graph_builder.add_edge("finish", END)

    return graph_builder.compile()


def main():
    graph = build_graph()

    result = graph.invoke({
        "retry_count": 0
    })

    print("最终 State：")
    print(result)
    print()
    print("说明：")
    print("第一次草稿没有通过检查，所以流程走 retry，再回到 write_draft。")
    print("第二次草稿包含“节点”和“边”，所以流程结束。")


if __name__ == "__main__":
    main()
