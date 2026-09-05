from demo_model import build_demo_model


def main():
    model = build_demo_model()

    print("stream 逐段输出：")
    for chunk in model.stream("请解释一下 stream 有什么用"):
        print(chunk.content, end="", flush=True)
    print()


if __name__ == "__main__":
    main()
