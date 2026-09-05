import warnings

warnings.filterwarnings(
    "ignore",
    message="`langchain-community` is being sunset.*",
    category=DeprecationWarning,
)

from langchain_community.document_loaders import PyPDFLoader

try:
    from .demo_files import RESUME_PDF_FILE, print_documents
except ImportError:
    from demo_files import RESUME_PDF_FILE, print_documents


def load_resume_pdf_documents():
    if not RESUME_PDF_FILE.exists():
        raise FileNotFoundError(f"简历 PDF 文件不存在：{RESUME_PDF_FILE}")

    loader = PyPDFLoader(str(RESUME_PDF_FILE))
    return loader.load()


def main():
    docs = load_resume_pdf_documents()
    print_documents("PyPDFLoader 读取简历 PDF 示例", docs, preview_chars=500000)


if __name__ == "__main__":
    main()
