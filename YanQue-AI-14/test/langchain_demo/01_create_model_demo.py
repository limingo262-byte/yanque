from demo_model import build_demo_model


def main():
    model = build_demo_model()

    print("模型对象：")
    print(model)
    print()
    print("这个对象后面可以调用 invoke / stream / batch。")


if __name__ == "__main__":
    main()
