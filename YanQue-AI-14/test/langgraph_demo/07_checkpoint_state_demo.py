from pprint import pprint
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph


# 这个 demo 重点看 Checkpoint：
# State 是流程运行时的数据。
# Checkpoint 是把某一刻的 State 保存下来。


class CheckpointState(TypedDict, total=False):
    question: str
    cleaned_question: str
    keyword: str
    answer: str


def clean_question_node(state: CheckpointState) -> CheckpointState:
    # 第一步：清理用户输入。
    return {
        "cleaned_question": state["question"].strip()
    }


def extract_keyword_node(state: CheckpointState) -> CheckpointState:
    # 第二步：从清理后的问题里提取关键词。
    question = state["cleaned_question"]
    keyword = "LangGraph" if "LangGraph" in question else "未知主题"

    return {
        "keyword": keyword
    }


def answer_node(state: CheckpointState) -> CheckpointState:
    # 第三步：根据 keyword 生成回答。
    return {
        "answer": f"你问的是 {state['keyword']}。这里演示 Checkpoint 如何保存 State。"
    }


def build_graph():
    graph_builder = StateGraph(CheckpointState)

    graph_builder.add_node("clean_question", clean_question_node)
    graph_builder.add_node("extract_keyword", extract_keyword_node)
    graph_builder.add_node("answer", answer_node)

    graph_builder.add_edge(START, "clean_question")
    graph_builder.add_edge("clean_question", "extract_keyword")
    graph_builder.add_edge("extract_keyword", "answer")
    graph_builder.add_edge("answer", END)

    # InMemorySaver 是内存版 Checkpoint。
    # 程序运行时可以保存 State，程序结束后这些数据就没了。
    checkpointer = InMemorySaver()

    # compile 时把 checkpointer 传进去，这张图才会保存运行状态。
    return graph_builder.compile(checkpointer=checkpointer)


def main():
    graph = build_graph()

    config = {
        "configurable": {
            # thread_id 用来区分不同对话或不同流程。
            # 同一个 thread_id 会保存到同一份 Checkpoint 记录里。
            "thread_id": "student-1001"
        }
    }

    result = graph.invoke(
        {
            "question": "  LangGraph 和 Chain 有什么区别？  "
        },
        config=config,
    )

    print("本次运行结束后的 State：")
    pprint(result)
    print()

    # get_state 可以根据 thread_id 取回刚才保存的 State。
    saved_checkpoint = graph.get_state(config)

    print("从 Checkpoint 里取出的 State：")
    pprint(saved_checkpoint.values)
    print()

    print("结论：")
    print("State 是流程正在使用的数据。")
    print("Checkpoint 是把某一刻的 State 保存下来。")


if __name__ == "__main__":
    main()
