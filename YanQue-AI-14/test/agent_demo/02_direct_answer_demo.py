from test.agent_demo.agent_factory import build_course_agent
from test.agent_demo.message_printer import print_final_answer, print_agent_messages


def main():
    agent = build_course_agent()

    result = agent.invoke({
        "messages": [
            {
                "role": "user",
                "content": "什么是大模型？",
            }
        ]
    })
    print_agent_messages(result["messages"])
    print("最终回答：")
    print_final_answer(result)


if __name__ == "__main__":
    main()
