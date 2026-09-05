from pprint import pprint
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph


# 这个 demo 重点看 Time Travel：
# 有 checkpointer 后，可以回看历史 checkpoint。
# 也可以从某个历史 checkpoint 分叉，修改 State 后重新往下跑。


class SqlState(TypedDict, total=False):
    question: str
    plan: str
    sql: str
    answer: str


def make_plan_node(state: SqlState) -> SqlState:
    question = state["question"]
    if "交易额" in question:
        plan = "统计订单交易额"
    else:
        plan = "统计订单数量"

    return {
        "plan": plan
    }


def generate_sql_node(state: SqlState) -> SqlState:
    if state["plan"] == "统计订单交易额":
        sql = "SELECT SUM(pay_amount) AS total_amount FROM order_info;"
    else:
        sql = "SELECT COUNT(*) AS order_count FROM order_info;"

    return {
        "sql": sql
    }


def answer_node(state: SqlState) -> SqlState:
    return {
        "answer": f"查询计划：{state['plan']}，生成 SQL：{state['sql']}"
    }


def build_graph():
    graph_builder = StateGraph(SqlState)

    graph_builder.add_node("make_plan", make_plan_node)
    graph_builder.add_node("generate_sql", generate_sql_node)
    graph_builder.add_node("answer", answer_node)

    graph_builder.add_edge(START, "make_plan")
    graph_builder.add_edge("make_plan", "generate_sql")
    graph_builder.add_edge("generate_sql", "answer")
    graph_builder.add_edge("answer", END)

    checkpointer = InMemorySaver()
    return graph_builder.compile(checkpointer=checkpointer)


def main():
    graph = build_graph()
    config = {
        "configurable": {
            "thread_id": "time-travel-thread-1"
        }
    }

    print("第一次完整运行")
    first_result = graph.invoke(
        {
            "question": "帮我查一下订单交易额。"
        },
        config=config,
    )
    pprint(first_result)
    print()

    print("回看历史 checkpoint")
    history = list(graph.get_state_history(config))
    for snapshot in history:
        print("next =", snapshot.next)
        pprint(snapshot.values)
    print()

    print("从 generate_sql 之前的 checkpoint 分叉，把 plan 改成统计订单数量")
    before_generate_sql = next(
        snapshot for snapshot in history
        if snapshot.next == ("generate_sql",)
    )

    fork_config = graph.update_state(
        before_generate_sql.config,
        values={
            "plan": "统计订单数量"
        },
    )

    fork_result = graph.invoke(None, config=fork_config)
    pprint(fork_result)
    print()

    print("回看历史 checkpoint")
    history = list(graph.get_state_history(config))
    for snapshot in history:
        print("next =", snapshot.next)
        pprint(snapshot.values)
    print()

    print("结论：")
    print("Time Travel 可以回看某一步的 State。")
    print("也可以从某个 checkpoint 分叉，改一部分 State 后重新执行后面的节点。")


if __name__ == "__main__":
    main()
