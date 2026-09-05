from typing import TypedDict

from langgraph.graph import END, START, StateGraph


# 这个 demo 重点看 State：
# 第一个节点写入 message，第二个节点继续写入 todo_list。


class StudyState(TypedDict, total=False):
    # total=False 表示这些字段不是一开始都必须有。
    # 例如初始 State 里只有 student_name 和 subject，
    # message、todo_list 是后面的节点慢慢补进去的。
    student_name: str
    subject: str
    message: str
    todo_list: list[str]


def create_message_node(state: StudyState) -> StudyState:
    # 从 State 里读取已有数据。
    student_name = state["student_name"]
    subject = state["subject"]

    # 返回的数据会写回 State。
    return {
        "message": f"{student_name}，今天先完成 {subject} 的基础练习。"
    }


def create_todo_node(state: StudyState) -> StudyState:
    # 这个节点继续读取 subject，并往 State 里写入 todo_list。
    subject = state["subject"]

    return {
        "todo_list": [
            f"复习 {subject} 的核心概念",
            f"完成 3 道 {subject} 练习题",
            "把不会的问题记录下来",
        ]
    }


def build_graph():
    graph_builder = StateGraph(StudyState)

    # 这里有两个节点。
    # 它们不是普通函数直接互相调用，而是交给 LangGraph 按边来执行。
    graph_builder.add_node("create_message", create_message_node)
    graph_builder.add_node("create_todo", create_todo_node)

    # 流程顺序：
    # START -> create_message -> create_todo -> END
    graph_builder.add_edge(START, "create_message")
    graph_builder.add_edge("create_message", "create_todo")
    graph_builder.add_edge("create_todo", END)

    return graph_builder.compile()


def main():
    graph = build_graph()

    # 初始 State 只传入两个字段。
    # 节点运行后，会逐步补上 message 和 todo_list。
    result = graph.invoke({
        "student_name": "小明",
        "subject": "LangGraph",
    })

    print("最终 State：")
    print(result)
    print()
    print("说明：")
    print("第一个节点往 State 里写入 message。")
    print("第二个节点继续往 State 里写入 todo_list。")


if __name__ == "__main__":
    main()
