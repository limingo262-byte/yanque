from test.agent_demo.agent_factory import build_course_agent
from test.agent_demo.agent_tools import AGENT_TOOLS


def main():
    agent = build_course_agent()

    print("Agent 已创建。")
    print()

    print("这个 Agent 可以使用的工具：")
    for tool in AGENT_TOOLS:
        print(f"- {tool.name}: {tool.description}")

    print()
    print("Agent 对象：")
    print(agent)


if __name__ == "__main__":
    main()
