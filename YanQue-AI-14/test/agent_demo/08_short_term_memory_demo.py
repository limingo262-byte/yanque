from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

from test.agent_demo.message_printer import print_agent_messages, print_final_answer
from test.langchain_demo.demo_model import build_demo_model


def main():
    model = build_demo_model()

    checkpointer = InMemorySaver()

    agent = create_agent(
        model=model,
        tools=[],
        system_prompt="你是一个学生课程助手，回答要简洁自然。",
        checkpointer=checkpointer,
    )

    same_thread_config = {
        "configurable": {
            "thread_id": "student-1001"
        }
    }

    other_thread_config = {
        "configurable": {
            "thread_id": "student-2002"
        }
    }

    print("第一次对话：告诉 Agent 我的名字")
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "我叫小明。",
                }
            ]
        },
        config=same_thread_config,
    )
    print_final_answer(result)

    print("\n第二次对话：同一个 thread_id，Agent 可以看到前面的历史")
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "我叫什么？",
                }
            ]
        },
        config=same_thread_config,
    )
    print_final_answer(result)

    print("\n同一个 thread_id 下，第二次调用后的完整 messages：")
    print_agent_messages(result["messages"])

    print("\n第三次对话：换一个 thread_id，相当于换了一段新对话")
    result = agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "我叫什么？",
                }
            ]
        },
        config=other_thread_config,
    )
    print_final_answer(result)

    print("\n结论：")
    print("同一个 thread_id 会接着前面的历史聊。")
    print("换一个 thread_id，就不会看到另一段对话里的历史。")
    print("InMemorySaver 的数据保存在当前 Python 程序内存里，程序停止后就没了。")


if __name__ == "__main__":
    main()
