"""最简单的 LangGraph 打断、继续运行和历史回看 Demo。

这个示例与具体业务无关，只演示：
1. 图执行到 interrupt() 时暂停；
2. 用户输入“继续运行”，通过 Command(resume=...) 恢复；
3. 使用 get_state_history() 回看本次执行历史。

运行：
    .venv\\Scripts\\python.exe test\\langgraph_demo\\17_ai_text_to_sql_interrupt_history_demo.py
"""

from __future__ import annotations

from pprint import pprint
from typing import TypedDict
from uuid import uuid4

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt


class DemoState(TypedDict, total=False):
    """图中节点共享的最小 State。"""

    message: str
    user_input: str
    result: str


def start_node(state: DemoState) -> DemoState:
    """开始节点：写入状态，然后进入人工打断节点。"""

    return {"message": "流程已经开始，等待用户确认。"}


def wait_for_user_node(state: DemoState) -> DemoState:
    """打断节点：暂停，等待用户输入“继续运行”。"""

    # interrupt 会暂停整个图，并把提示内容返回给调用方。
    # 当前 State 和下一步执行位置会由 checkpointer 保存。
    user_input = interrupt("请输入‘继续运行’后恢复流程：")

    # 恢复时，Command(resume=...) 传入的值就是 interrupt() 的返回值。
    return {"user_input": str(user_input)}


def finish_node(state: DemoState) -> DemoState:
    """结束节点：收到用户输入后继续执行。"""

    return {"result": f"流程已继续运行，收到输入：{state['user_input']}"}


def build_graph():
    """创建带 InMemorySaver 的图。"""

    builder = StateGraph(DemoState)
    builder.add_node("start", start_node)
    builder.add_node("wait_for_user", wait_for_user_node)
    builder.add_node("finish", finish_node)
    builder.add_edge(START, "start")
    builder.add_edge("start", "wait_for_user")
    builder.add_edge("wait_for_user", "finish")
    builder.add_edge("finish", END)

    # checkpointer 保存每个 thread 的 State 和执行位置。
    # InMemorySaver 仅用于演示，程序退出后历史会消失。
    return builder.compile(checkpointer=InMemorySaver())


def read_history(graph, config: dict[str, object]) -> list[dict[str, object]]:
    """读取当前 conversation_id 下的历史 checkpoint。"""

    history = []
    # get_state_history 返回同一个 thread_id 的所有 State 快照。
    for snapshot in reversed(list(graph.get_state_history(config))):
        history.append(
            {
                "step": snapshot.metadata.get("step"),
                "next": list(snapshot.next),
                "state": dict(snapshot.values),
            }
        )
    return history


def main() -> None:
    graph = build_graph()

    # conversation_id 同时作为 LangGraph 的 thread_id。
    # 恢复时必须使用同一个 ID，才能找到之前暂停的 State。
    conversation_id = uuid4().hex
    config = {"configurable": {"thread_id": conversation_id}}

    print("conversation_id:", conversation_id)
    print("\n第一次执行：")
    paused_result = graph.invoke({}, config=config)
    print("图已暂停，interrupt 返回内容：")
    pprint(paused_result.get("__interrupt__"))

    user_input = input("请输入‘继续运行’：")
    final_result = graph.invoke(Command(resume=user_input), config=config)
    print("恢复后的最终 State：")
    pprint(final_result)

    # 保存历史：实际项目可以把 history 序列化后交给 Java 保存。
    state_history = read_history(graph, config)
    print("\n本次会话历史：")
    pprint(state_history)

    print("\n关键结论：")
    print("1. interrupt() 负责暂停流程。")
    print("2. Command(resume=...) 负责恢复流程。")
    print("3. conversation_id/thread_id 负责找到原来的 State。")
    print("4. get_state_history() 负责回看并保存执行历史。")


if __name__ == "__main__":
    main()
