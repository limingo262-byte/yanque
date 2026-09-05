import warnings

warnings.filterwarnings(
    "ignore",
    message="`langchain-community` is being sunset.*",
    category=DeprecationWarning,
)

from langchain_community.document_loaders import TextLoader

try:
    from .demo_files import TEXT_FILE, print_documents
except ImportError:
    from demo_files import TEXT_FILE, print_documents


def load_text_documents():
    loader = TextLoader(
        str(TEXT_FILE),
        encoding="utf-8",
    )
    return loader.load()


def main():
    docs = load_text_documents()
    print_documents("TextLoader 读取 TXT 示例", docs)


if __name__ == "__main__":
    main()
