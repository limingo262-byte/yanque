from test.agent_demo.agent_factory import build_course_agent
from test.agent_demo.message_printer import print_agent_messages, print_final_answer


def main():
    agent = build_course_agent()

    result = agent.invoke({
        "messages": [
            {
                "role": "user",
                "content": "我明天有什么课？明天是 2026-07-09。",
            }
        ]
    })

    print_agent_messages(result["messages"])

    print("=" * 60)
    print("最终回答：")
    print_final_answer(result)


if __name__ == "__main__":
    main()
