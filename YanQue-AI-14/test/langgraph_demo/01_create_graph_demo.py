from typing import TypedDict

from langgraph.graph import END, START, StateGraph


# 这个 demo 只看最小流程：
# 输入问题 -> 清理问题 -> 生成回答。
#
# LangGraph 代码通常分成 4 步：
# 1. 定义 State。
# 2. 编写节点函数。
# 3. 用 add_node / add_edge 把节点连起来。
# 4. compile 后 invoke 运行。


class DemoState(TypedDict, total=False):
    # State 就是整个流程运行时携带的数据。
    # 每个节点都可以从 state 里读取数据，也可以返回新数据写回 state。
    question: str
    normalized_question: str
    answer: str


def normalize_question(state: DemoState) -> DemoState:
    # 节点函数接收当前 State。
    question = state["question"].strip()

    # 返回的字典会被合并回 State。
    # 这里相当于往 State 里新增 normalized_question。
    return {
        "normalized_question": question
    }


def answer_question(state: DemoState) -> DemoState:
    # 后面的节点可以读取前面节点写入的 normalized_question。
    question = state["normalized_question"]
    return {
        "answer": f"收到问题：{question}。这是一个最小 LangGraph 示例。"
    }


def build_graph():
    # StateGraph(DemoState) 表示：这张图运行时使用 DemoState 作为数据结构。
    graph_builder = StateGraph(DemoState)

    # add_node(节点名称, 节点函数)
    # 节点名称是流程图里的名字，节点函数是真正执行的 Python 函数。
    graph_builder.add_node("normalize_question", normalize_question)
    graph_builder.add_node("answer_question", answer_question)

    # START 表示流程开始。
    # END 表示流程结束。
    # add_edge 表示固定顺序：上一个节点执行完，就进入下一个节点。
    graph_builder.add_edge(START, "normalize_question")
    graph_builder.add_edge("normalize_question", "answer_question")
    graph_builder.add_edge("answer_question", END)

    # compile 之后，图才变成可以运行的对象。
    return graph_builder.compile()


def main():
    graph = build_graph()

    # invoke 传入初始 State。
    # 运行结束后，返回最终 State。
    result = graph.invoke({
        "question": "  什么是 LangGraph？  "
    })

    print("最终 State：")
    print(result)
    print()
    print("最终回答：")
    print(result["answer"])


if __name__ == "__main__":
    main()
