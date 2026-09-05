import warnings

warnings.filterwarnings(
    "ignore",
    message="`langchain-community` is being sunset.*",
    category=DeprecationWarning,
)

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    from .demo_files import TEXT_FILE, print_documents
except ImportError:
    from demo_files import TEXT_FILE, print_documents


def split_text_documents():
    docs = TextLoader(str(TEXT_FILE), encoding="utf-8").load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=80,
        chunk_overlap=20,
    )
    return splitter.split_documents(docs)


def main():
    chunks = split_text_documents()
    print_documents("RecursiveCharacterTextSplitter 切分 TXT 示例", chunks)


if __name__ == "__main__":
    main()
