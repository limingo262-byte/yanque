from pprint import pprint
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph


# 这个 demo 重点看：
# 一个 checkpointer 里可以保存多份 checkpoint 记录。
# 不同记录用不同 thread_id 区分。


class CheckpointState(TypedDict, total=False):
    question: str
    cleaned_question: str
    keyword: str
    answer: str


def clean_question_node(state: CheckpointState) -> CheckpointState:
    return {
        "cleaned_question": state["question"].strip()
    }


def extract_keyword_node(state: CheckpointState) -> CheckpointState:
    question = state["cleaned_question"]
    keyword = "LangGraph" if "LangGraph" in question else "未知主题"

    return {
        "keyword": keyword
    }


def answer_node(state: CheckpointState) -> CheckpointState:
    return {
        "answer": f"你问的是 {state['keyword']}。"
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

    checkpointer = InMemorySaver()
    return graph_builder.compile(checkpointer=checkpointer)


def main():
    graph = build_graph()

    student_1001_config = {
        "configurable": {
            "thread_id": "student-1001"
        }
    }
    student_1002_config = {
        "configurable": {
            "thread_id": "student-1002"
        }
    }

    graph.invoke(
        {
            "question": "  LangGraph 和 Chain 有什么区别？  "
        },
        config=student_1001_config,
    )
    graph.invoke(
        {
            "question": "  Python 装饰器是什么？  "
        },
        config=student_1002_config,
    )

    student_1001_checkpoint = graph.get_state(student_1001_config)
    student_1002_checkpoint = graph.get_state(student_1002_config)

    print("student-1001 从 Checkpoint 里取出的 State：")
    pprint(student_1001_checkpoint.values)
    print()

    print("student-1002 从 Checkpoint 里取出的 State：")
    pprint(student_1002_checkpoint.values)
    print()

    print("结论：")
    print("这里不是创建多个 checkpointer。")
    print("这里是一个 checkpointer 根据不同 thread_id 保存多份 checkpoint 记录。")


if __name__ == "__main__":
    main()
