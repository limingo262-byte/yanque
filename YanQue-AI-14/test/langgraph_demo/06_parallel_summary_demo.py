from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph


# 这个 demo 重点看：
# 一个节点执行完后，可以同时进入多个后续节点。
#
# prepare_topic 执行完后，会同时进入 concept、use_case、warning。
# concept、use_case、warning 都会写 notes。
# 所以 notes 需要指定一个合并函数 merge_list。


def merge_list(left: list[str], right: list[str]) -> list[str]:
    # LangGraph 合并 notes 时会调用这个函数。
    # left 是已有内容，right 是新节点返回的内容。
    return left + right


class SummaryState(TypedDict, total=False):
    topic: str
    normalized_topic: str
    # Annotated 的意思是：
    # notes 这个字段如果被多个节点同时写入，就用 merge_list 合并。
    notes: Annotated[list[str], merge_list]
    summary: str


def prepare_topic_node(state: SummaryState) -> SummaryState:
    # 第一个节点先把主题清理好。
    # 后面多个节点都会基于这个 normalized_topic 继续处理。
    return {
        "normalized_topic": state["topic"].strip()
    }


def concept_node(state: SummaryState) -> SummaryState:
    # 第一个并行节点：补充概念说明。
    topic = state["normalized_topic"]
    return {
        "notes": [f"概念：{topic} 用图组织流程。"]
    }


def use_case_node(state: SummaryState) -> SummaryState:
    # 第二个并行节点：补充适用场景。
    return {
        "notes": ["场景：适合有分支、有状态、有重试的任务。"]
    }


def warning_node(state: SummaryState) -> SummaryState:
    # 第三个并行节点：补充注意事项。
    return {
        "notes": ["注意：LangGraph 不会替业务系统做权限校验。"]
    }


def summary_node(state: SummaryState) -> SummaryState:
    # 前面三个节点的 notes 会被合并成一个列表。
    return {
        "summary": "\n".join(state["notes"])
    }


def build_graph():
    graph_builder = StateGraph(SummaryState)

    graph_builder.add_node("prepare_topic", prepare_topic_node)
    graph_builder.add_node("concept", concept_node)
    graph_builder.add_node("use_case", use_case_node)
    graph_builder.add_node("warning", warning_node)
    graph_builder.add_node("summary", summary_node)

    # 先执行 prepare_topic。
    graph_builder.add_edge(START, "prepare_topic")

    # 一个节点执行完后，可以同时进入多个后续节点。
    # 这就是 fan-out：prepare_topic -> concept / use_case / warning。
    graph_builder.add_edge("prepare_topic", "concept")
    graph_builder.add_edge("prepare_topic", "use_case")
    graph_builder.add_edge("prepare_topic", "warning")

    # 三个节点都完成后，再进入 summary 汇总。
    # 列表形式表示 fan-in：等待 concept/use_case/warning 全部完成后，
    # summary 只执行一次。
    graph_builder.add_edge(["concept", "use_case", "warning"], "summary")
    graph_builder.add_edge("summary", END)

    return graph_builder.compile()


def main():
    graph = build_graph()

    result = graph.invoke({
        "topic": "LangGraph",
        "notes": [],
    })

    print("汇总结果：")
    print(result["summary"])
    print()
    print("说明：")
    print("prepare_topic 执行完后，同时进入 concept、use_case、warning。")
    print("concept、use_case、warning 三个节点都会往 notes 里写内容。")
    print("notes 使用 merge_list 合并多个节点的结果。")


if __name__ == "__main__":
    main()
