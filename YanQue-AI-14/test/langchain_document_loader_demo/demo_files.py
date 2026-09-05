from __future__ import annotations

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
TEXT_FILE = DATA_DIR / "course_knowledge.txt"
HTML_FILE = DATA_DIR / "course_help.html"
PDF_FILE = DATA_DIR / "course_intro.pdf"
RESUME_PDF_FILE = Path("/Users/huangjin/Downloads/文件生成平台/第2课：动态数据源加载与切换让平台拥有“多核大脑”.pdf")


def print_documents(title: str, docs: list, preview_chars: int = 220) -> None:
    print(title)
    print("=" * len(title))
    print("Document 数量：", len(docs))
    print()

    for index, doc in enumerate(docs, start=1):
        print(f"[Document {index}]")
        print("metadata:", doc.metadata)
        print("content:")
        print(doc.page_content[:preview_chars])
        print()
