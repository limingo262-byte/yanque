from __future__ import annotations

import contextlib
import os
import threading
import warnings
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

os.environ.setdefault("USER_AGENT", "YanQue-AI-LangChain-Document-Loader-Demo/1.0")
warnings.filterwarnings(
    "ignore",
    message="`langchain-community` is being sunset.*",
    category=DeprecationWarning,
)

from langchain_community.document_loaders import WebBaseLoader

try:
    from .demo_files import DATA_DIR, HTML_FILE, print_documents
except ImportError:
    from demo_files import DATA_DIR, HTML_FILE, print_documents


class QuietHTTPRequestHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:
        return


@contextlib.contextmanager
def local_http_server(directory: Path):
    handler = partial(QuietHTTPRequestHandler, directory=str(directory))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def load_web_documents():
    with local_http_server(DATA_DIR) as base_url:
        loader = WebBaseLoader(f"{base_url}/{HTML_FILE.name}")
        return loader.load()


def main():
    docs = load_web_documents()
    print_documents("WebBaseLoader 读取网页示例", docs)


if __name__ == "__main__":
    main()
