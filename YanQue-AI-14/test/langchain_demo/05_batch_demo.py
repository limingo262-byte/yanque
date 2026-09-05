from demo_model import build_demo_model


def main():
    model = build_demo_model()

    questions = [
        "invoke 是什么？",
        "stream 是什么？",
        "batch 是什么？",
    ]
    responses = model.batch(questions)

    # 第几个问题，对应第几个回答。
    for index in range(len(questions)):
        question = questions[index]
        response = responses[index]

        print(f"问题：{question}")
        print(f"回答：{response.content}")
        print()


if __name__ == "__main__":
    main()
