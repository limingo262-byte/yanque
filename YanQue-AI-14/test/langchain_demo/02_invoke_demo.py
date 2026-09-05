from demo_model import build_demo_model


def main():
    model = build_demo_model()

    response = model.invoke("什么是 LangChain？")

    print("invoke 返回的是完整 AIMessage：")
    print(response)
    print()
    print("真正的回答文本：")
    print(response.content)


if __name__ == "__main__":
    main()
