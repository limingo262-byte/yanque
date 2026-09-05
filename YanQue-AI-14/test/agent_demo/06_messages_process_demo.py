from test.agent_demo.agent_factory import build_course_agent
from test.agent_demo.message_printer import print_agent_messages


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

    print("下面按顺序打印 Agent 运行过程中产生的消息。")
    print("看到 ai 消息里有工具调用，再看到 tool 消息，就说明 Agent 确实执行了工具。")
    print_agent_messages(result["messages"])


if __name__ == "__main__":
    main()
