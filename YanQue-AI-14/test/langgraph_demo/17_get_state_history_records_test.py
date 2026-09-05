from pprint import pprint
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph

from yanque_ai.modules.text_to_sql.graph import _build_state_history


# 这个 test 重点看 _graph.get_state_history(config)：
# 它拿到的不是“最终一个大 State”，而是一串 checkpoint 快照。
# 每个快照里的 tasks[*].result 才是对应节点这一步写入 State 的数据。


class DemoState(TypedDict, total=False):
    question: str
    normalized_question: str
    selected_tables: list[str]
    sql: str


def normalize_question(state: DemoState) -> DemoState:
    return {
        "normalized_question": state["question"].strip()
    }


def select_tables(state: DemoState) -> DemoState:
    return {
        "selected_tables": ["order_payment"]
    }


def generate_sql(state: DemoState) -> DemoState:
    return {
        "sql": "select count(*) as order_count from order_payment"
    }


def build_graph():
    graph_builder = StateGraph(DemoState)

    graph_builder.add_node("normalize_question", normalize_question)
    graph_builder.add_node("select_tables", select_tables)
    graph_builder.add_node("generate_sql", generate_sql)

    graph_builder.add_edge(START, "normalize_question")
    graph_builder.add_edge("normalize_question", "select_tables")
    graph_builder.add_edge("select_tables", "generate_sql")
    graph_builder.add_edge("generate_sql", END)

    return graph_builder.compile(checkpointer=InMemorySaver())


def main():
    _graph = build_graph()
    config = {
        "configurable": {
            "thread_id": "state-history-demo-1"
        }
    }

    final_state = _graph.invoke(
        {
            "question": "  帮我查 2026 年 6 月订单量  "
        },
        config=config,
    )
    print("最终 State：")
    pprint(final_state)
    print()

    raw_history = list(_graph.get_state_history(config))
    print("get_state_history 原始快照数量：", len(raw_history))
    for snapshot in raw_history:
        print("step =", snapshot.metadata.get("step"), "next =", snapshot.next)
        print("values =")
        pprint(snapshot.values)
        print("tasks result =")
        pprint([
            {
                "name": task.name,
                "result": task.result,
            }
            for task in snapshot.tasks
            if task.result is not None
        ])
        print()

    state_history = _build_state_history(raw_history)
    print("整理后的节点写入历史：")
    pprint(state_history)
    print()

    assert final_state["normalized_question"] == "帮我查 2026 年 6 月订单量"
    assert final_state["selected_tables"] == ["order_payment"]
    assert final_state["sql"].startswith("select count")

    node_names = [
        write["node"]
        for item in state_history
        for write in item["writes"]
    ]
    assert node_names == [
        "__start__",
        "normalize_question",
        "select_tables",
        "generate_sql",
    ]

    writes_by_node = {
        write["node"]: write["result"]
        for item in state_history
        for write in item["writes"]
    }
    assert writes_by_node["__start__"] == {
        "question": "  帮我查 2026 年 6 月订单量  "
    }
    assert writes_by_node["normalize_question"] == {
        "normalized_question": "帮我查 2026 年 6 月订单量"
    }
    assert writes_by_node["select_tables"] == {
        "selected_tables": ["order_payment"]
    }
    assert writes_by_node["generate_sql"] == {
        "sql": "select count(*) as order_count from order_payment"
    }

    print("结论：")
    print("_graph.get_state_history(config) 可以拿到每个 checkpoint。")
    print("当前项目用 tasks[*].result 整理出每个节点本步写入的数据。")


if __name__ == "__main__":
    main()
