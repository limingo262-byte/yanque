from pprint import pprint
from typing import TypedDict

from langgraph.errors import NodeError
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, RetryPolicy


# 这个 demo 重点看 Fault tolerance：
# 节点失败后，可以自动重试。
# 重试仍然失败后，可以进入 error_handler 做降级处理。


class FaultState(TypedDict, total=False):
    question: str
    data: str
    answer: str


def call_data_service_node(state: FaultState) -> FaultState:
    print("调用外部数据服务，但这次一直失败。")
    raise ConnectionError("模拟数据服务暂时不可用")


def data_service_error_handler(
    state: FaultState,
    error: NodeError,
) -> Command:
    return Command(
        update={
            "data": f"降级数据：外部服务失败，原因是 {error.error}"
        },
        goto="answer",
    )


def answer_node(state: FaultState) -> FaultState:
    return {
        "answer": f"问题：{state['question']} 返回：{state['data']}"
    }


def build_graph():
    graph_builder = StateGraph(FaultState)

    graph_builder.add_node(
        "call_data_service",
        call_data_service_node,
        retry_policy=RetryPolicy(
            max_attempts=3,
            initial_interval=0.1,
            jitter=False,
            retry_on=ConnectionError,
        ),
        error_handler=data_service_error_handler,
    )
    graph_builder.add_node("answer", answer_node)

    graph_builder.add_edge(START, "call_data_service")
    graph_builder.add_edge("answer", END)

    return graph_builder.compile()


def main():
    graph = build_graph()

    result = graph.invoke({
        "question": "帮我查询今天的订单数据。"
    })

    print()
    print("最终 State：")
    pprint(result)
    print()

    print("结论：")
    print("retry_policy 负责失败后自动重试。")
    print("error_handler 负责重试耗尽后的降级或补偿流程。")


if __name__ == "__main__":
    main()
