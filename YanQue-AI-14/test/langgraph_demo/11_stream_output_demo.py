from pprint import pprint
from typing import TypedDict

from langgraph.graph import END, START, StateGraph


# 这个 demo 重点看 stream：
# invoke 会等整张图跑完，再返回最终 State。
# stream 可以在图运行过程中，一步一步看到节点输出。


class StreamState(TypedDict, total=False):
    question: str
    cleaned_question: str
    keyword: str
    answer: str


def clean_question_node(state: StreamState) -> StreamState:
    return {
        "cleaned_question": state["question"].strip()
    }


def extract_keyword_node(state: StreamState) -> StreamState:
    question = state["cleaned_question"]
    keyword = "LangGraph" if "LangGraph" in question else "未知主题"

    return {
        "keyword": keyword
    }


def answer_node(state: StreamState) -> StreamState:
    return {
        "answer": f"你问的是 {state['keyword']}。"
    }


def build_graph():
    graph_builder = StateGraph(StreamState)

    graph_builder.add_node("clean_question", clean_question_node)
    graph_builder.add_node("extract_keyword", extract_keyword_node)
    graph_builder.add_node("answer", answer_node)

    graph_builder.add_edge(START, "clean_question")
    graph_builder.add_edge("clean_question", "extract_keyword")
    graph_builder.add_edge("extract_keyword", "answer")
    graph_builder.add_edge("answer", END)

    return graph_builder.compile()


def main():
    graph = build_graph()
    input_state = {
        "question": "  LangGraph 的 stream 有什么用？  "
    }

    print("一、invoke：直接等待整张图跑完，返回最终 State")
    final_state = graph.invoke(input_state)
    pprint(final_state)
    print()

    print("二、stream 默认模式：按节点输出本次写入的内容")
    for event in graph.stream(input_state):
        pprint(event)
    print()

    print("三、stream_mode='values'：每一步都输出当前完整 State")
    for state in graph.stream(input_state, stream_mode="values"):
        pprint(state)
    print()

    print("结论：")
    print("invoke 适合只关心最终结果。")
    print("stream 适合观察每个节点的执行过程，也适合以后做前端进度展示。")
    print("默认 stream 输出节点更新；stream_mode='values' 输出每一步完整 State。")


if __name__ == "__main__":
    main()
