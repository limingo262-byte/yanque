from dataclasses import dataclass
from pprint import pprint
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.runtime import Runtime
from langgraph.store.memory import InMemoryStore


# 这个 demo 重点看 Store：
# Checkpointer 保存某个 thread_id 里的短期状态。
# Store 保存跨 thread 都能读取的长期记忆。


@dataclass
class UserContext:
    user_id: str


class MemoryState(TypedDict, total=False):
    question: str
    saved_memory: str
    answer: str


def save_memory_node(
    state: MemoryState,
    runtime: Runtime[UserContext],
) -> MemoryState:
    question = state["question"]

    # namespace 是 Store 里的分组路径。
    # 这里用 tuple 表示：student-1001 / memories。
    # tuple 可以有多级，例如 (tenant_id, user_id, "memories", "preferences")。
    namespace = (runtime.context.user_id, "memories")

    # 课堂里用简单规则模拟“记忆抽取”。
    # 真实项目里通常会让模型判断这句话是否值得长期保存。
    if "Java" in question and "举例" in question:
        memory = "用户希望以后尽量用 Java 举例。"
        runtime.store.put(
            namespace,
            "example_language_preference",
            {"memory": memory},
        )
        return {
            "saved_memory": memory
        }

    return {
        "saved_memory": "本次输入没有写入新的长期记忆。"
    }


def answer_node(
    state: MemoryState,
    runtime: Runtime[UserContext],
) -> MemoryState:
    # 读取时使用同一个 namespace，才能找到前面写入的记忆。
    namespace = (runtime.context.user_id, "memories")
    memories = runtime.store.search(namespace, limit=10)

    memory_text = "；".join(item.value["memory"] for item in memories)
    if not memory_text:
        memory_text = "暂无长期记忆"

    return {
        "answer": f"当前用户长期记忆：{memory_text} 本次问题：{state['question']}"
    }


def build_graph():
    graph_builder = StateGraph(MemoryState, context_schema=UserContext)

    graph_builder.add_node("save_memory", save_memory_node)
    graph_builder.add_node("answer", answer_node)

    graph_builder.add_edge(START, "save_memory")
    graph_builder.add_edge("save_memory", "answer")
    graph_builder.add_edge("answer", END)

    checkpointer = InMemorySaver()
    store = InMemoryStore()

    return graph_builder.compile(
        checkpointer=checkpointer,
        store=store,
    )


def main():
    graph = build_graph()
    context = UserContext(user_id="student-1001")

    first_config = {
        "configurable": {
            "thread_id": "thread-1"
        }
    }
    second_config = {
        "configurable": {
            "thread_id": "thread-2"
        }
    }

    print("第一次对话：写入长期记忆")
    first_result = graph.invoke(
        {
            "question": "以后讲代码时尽量用 Java 举例。"
        },
        config=first_config,
        context=context,
    )
    pprint(first_result)
    print()

    print("第二次对话：换了 thread_id，但 user_id 一样，仍然能读到 Store 里的记忆")
    second_result = graph.invoke(
        {
            "question": "帮我解释一下接口设计。"
        },
        config=second_config,
        context=context,
    )
    pprint(second_result)
    print()

    print("结论：")
    print("Checkpointer 根据 thread_id 保存短期状态。")
    print("Store 根据 namespace 保存长期记忆，可以跨 thread 读取。")
    print("InMemoryStore 只存在当前 Python 进程内，程序结束后数据会丢失。")


if __name__ == "__main__":
    main()
