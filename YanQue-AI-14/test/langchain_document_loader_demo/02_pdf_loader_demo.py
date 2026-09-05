import warnings

warnings.filterwarnings(
    "ignore",
    message="`langchain-community` is being sunset.*",
    category=DeprecationWarning,
)

from langchain_community.document_loaders import PyPDFLoader

try:
    from .demo_files import PDF_FILE, print_documents
except ImportError:
    from demo_files import PDF_FILE, print_documents


def load_pdf_documents():
    loader = PyPDFLoader(str(PDF_FILE))
    return loader.load()


def main():
    docs = load_pdf_documents()
    print_documents("PyPDFLoader 读取 PDF 示例", docs)


if __name__ == "__main__":
    main()
