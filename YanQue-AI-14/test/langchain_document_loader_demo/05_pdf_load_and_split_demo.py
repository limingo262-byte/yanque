import warnings

warnings.filterwarnings(
    "ignore",
    message="`langchain-community` is being sunset.*",
    category=DeprecationWarning,
)

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    from .demo_files import PDF_FILE, print_documents
except ImportError:
    from demo_files import PDF_FILE, print_documents


def load_and_split_pdf_documents():
    docs = PyPDFLoader(str(PDF_FILE)).load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=70,
        chunk_overlap=15,
    )
    return splitter.split_documents(docs)


def main():
    chunks = load_and_split_pdf_documents()
    print_documents("PDF 读取后继续切分示例", chunks)


if __name__ == "__main__":
    main()
