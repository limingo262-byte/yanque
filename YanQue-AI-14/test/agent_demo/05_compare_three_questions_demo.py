from test.agent_demo.agent_factory import build_course_agent
from test.agent_demo.message_printer import print_final_answer


def main():
    agent = build_course_agent()

    questions = [
        "什么是大模型？",
        "我明天有什么课？明天是 2026-07-09。",
        "我们课程里 RAG 怎么实现？",
    ]

    for question in questions:
        print("=" * 60)
        print("学生问题：", question)

        result = agent.invoke({
            "messages": [
                {
                    "role": "user",
                    "content": question,
                }
            ]
        })

        print("最终回答：")
        print_final_answer(result)


if __name__ == "__main__":
    main()
