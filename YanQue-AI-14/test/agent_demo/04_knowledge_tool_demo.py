from test.agent_demo.agent_factory import build_course_agent
from test.agent_demo.message_printer import print_agent_messages, print_final_answer


def main():
    agent = build_course_agent()

    result = agent.invoke({
        "messages": [
            {
                "role": "user",
                "content": "我们课程里 RAG 怎么实现？",
            }
        ]
    })

    print_agent_messages(result["messages"])

    print("=" * 60)
    print("最终回答：")
    print_final_answer(result)


if __name__ == "__main__":
    main()
