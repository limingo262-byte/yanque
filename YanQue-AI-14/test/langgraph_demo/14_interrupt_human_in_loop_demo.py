from pprint import pprint
from typing import Literal, TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt


# 这个 demo 重点看 Interrupt / Human-in-the-loop：
# 流程可以在某个节点暂停，等待人工确认。
# 人工确认后，用 Command(resume=...) 继续执行。


class ReviewState(TypedDict, total=False):
    question: str
    sql: str
    approved: bool
    review_reason: str
    suggestion: str
    answer: str


def generate_sql_node(state: ReviewState) -> ReviewState:
    question = state["question"]
    if "删除" in question:
        sql = "DELETE FROM order_info WHERE status = 'TIMEOUT';"
    else:
        sql = "SELECT COUNT(*) AS order_count FROM order_info;"

    return {
        "sql": sql
    }


def review_sql_node(state: ReviewState) -> ReviewState:
    # interrupt 会让图暂停。
    # resume 时传入的值，会变成 interrupt(...) 的返回值。
    review_result = interrupt({
        "message": "SQL 即将执行，请人工确认是否放行。",
        "sql": state["sql"],
        "expected_resume": {
            "approved": "是否同意执行，true 或 false",
            "reason": "审核原因",
            "suggestion": "修改建议，可选",
        },
    })

    return {
        "approved": bool(review_result["approved"]),
        "review_reason": review_result["reason"],
        "suggestion": review_result.get("suggestion", ""),
    }


def choose_next_node(state: ReviewState) -> Literal["execute_sql", "reject_sql"]:
    if state["approved"]:
        return "execute_sql"
    return "reject_sql"


def execute_sql_node(state: ReviewState) -> ReviewState:
    return {
        "answer": f"已执行 SQL：{state['sql']}"
    }


def reject_sql_node(state: ReviewState) -> ReviewState:
    return {
        "answer": (
            f"人工拒绝执行 SQL：{state['sql']} "
            f"原因：{state['review_reason']}。"
            f"建议：{state['suggestion']}"
        )
    }


def build_graph():
    graph_builder = StateGraph(ReviewState)

    graph_builder.add_node("generate_sql", generate_sql_node)
    graph_builder.add_node("review_sql", review_sql_node)
    graph_builder.add_node("execute_sql", execute_sql_node)
    graph_builder.add_node("reject_sql", reject_sql_node)

    graph_builder.add_edge(START, "generate_sql")
    graph_builder.add_edge("generate_sql", "review_sql")
    graph_builder.add_conditional_edges(
        "review_sql",
        choose_next_node,
        {
            "execute_sql": "execute_sql",
            "reject_sql": "reject_sql",
        },
    )
    graph_builder.add_edge("execute_sql", END)
    graph_builder.add_edge("reject_sql", END)

    checkpointer = InMemorySaver()
    return graph_builder.compile(checkpointer=checkpointer)


def main():
    graph = build_graph()
    config = {
        "configurable": {
            "thread_id": "review-thread-1"
        }
    }

    print("第一次运行：图会在 review_sql 节点暂停")
    paused_result = graph.invoke(
        {
            "question": "帮我删除超时订单。"
        },
        config=config,
    )
    pprint(paused_result)
    print()

    print("人工确认：这里模拟审核人员拒绝执行")
    final_result = graph.invoke(
        Command(resume={
            "approved": False,
            "reason": "DELETE 语句不能在课堂演示里自动执行",
            "suggestion": "改成 SELECT 查询，先确认要处理的订单数量",
        }),
        config=config,
    )
    pprint(final_result)
    print()

    print("结论：")
    print("Interrupt 适合 SQL 执行、付款、删除数据等需要人工确认的流程。")
    print("恢复执行时必须使用同一个 thread_id。")


if __name__ == "__main__":
    main()
