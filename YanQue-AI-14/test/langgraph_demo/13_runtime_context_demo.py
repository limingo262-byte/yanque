from dataclasses import dataclass
from pprint import pprint
from typing import TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.runtime import Runtime


# 这个 demo 重点看 Runtime / context：
# State 保存流程中间结果。
# context 保存运行这张图时的外部业务上下文，例如 user_id、tenant_id、权限范围。


@dataclass
class RequestContext:
    user_id: str
    tenant_id: str
    allowed_tables: list[str]


class QueryState(TypedDict, total=False):
    question: str
    selected_tables: list[str]
    answer: str


def select_schema_node(
    state: QueryState,
    runtime: Runtime[RequestContext],
) -> QueryState:
    question = state["question"]
    allowed_tables = runtime.context.allowed_tables

    selected_tables = []
    if "订单" in question and "order" in allowed_tables:
        selected_tables.append("order")
    if "学生" in question and "student" in allowed_tables:
        selected_tables.append("student")

    return {
        "selected_tables": selected_tables
    }


def answer_node(
    state: QueryState,
    runtime: Runtime[RequestContext],
) -> QueryState:
    context = runtime.context
    tables = "、".join(state["selected_tables"]) or "没有可用表"

    return {
        "answer": (
            f"用户 {context.user_id} 属于租户 {context.tenant_id}。"
            f"根据权限，本次只能使用：{tables}。"
        )
    }


def build_graph():
    graph_builder = StateGraph(QueryState, context_schema=RequestContext)

    graph_builder.add_node("select_schema", select_schema_node)
    graph_builder.add_node("answer", answer_node)

    graph_builder.add_edge(START, "select_schema")
    graph_builder.add_edge("select_schema", "answer")
    graph_builder.add_edge("answer", END)

    return graph_builder.compile()


def main():
    graph = build_graph()

    context = RequestContext(
        user_id="student-1001",
        tenant_id="yanque-school",
        allowed_tables=["order"],
    )

    result = graph.invoke(
        {
            "question": "帮我查一下订单和学生数据。"
        },
        context=context,
    )

    print("最终 State：")
    pprint(result)
    print()

    print("结论：")
    print("State 里放流程要加工的数据。")
    print("runtime.context 里放运行时外部信息，例如用户、租户和权限范围。")


if __name__ == "__main__":
    main()
