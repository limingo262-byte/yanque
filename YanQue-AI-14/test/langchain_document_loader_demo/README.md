# LangChain 文档读取和切分演示脚本

这些脚本对应第七天讲义《LangChain 包结构与文档加载》里的案例。

本包只演示两段内容：

```text
文档读取
  ↓
文档切分
```

运行方式：

```bash
uv run python test/langchain_document_loader_demo/01_text_loader_demo.py
uv run python test/langchain_document_loader_demo/02_pdf_loader_demo.py
uv run python test/langchain_document_loader_demo/03_web_base_loader_demo.py
uv run python test/langchain_document_loader_demo/04_text_splitter_demo.py
uv run python test/langchain_document_loader_demo/05_pdf_load_and_split_demo.py
uv run python test/langchain_document_loader_demo/06_resume_pdf_loader_demo.py
```

一次性验证：

```bash
uv run python -m unittest test.langchain_document_loader_demo.test_document_loader_examples
```

脚本说明：

```text
01_text_loader_demo.py          TextLoader 读取 TXT
02_pdf_loader_demo.py           PyPDFLoader 读取 PDF
03_web_base_loader_demo.py      WebBaseLoader 读取网页
04_text_splitter_demo.py        RecursiveCharacterTextSplitter 切分 TXT
05_pdf_load_and_split_demo.py   PDF 读取后继续切分
06_resume_pdf_loader_demo.py    PyPDFLoader 读取真实简历 PDF
```

`03_web_base_loader_demo.py` 会在本地临时启动一个 HTTP 服务读取样例网页，不依赖外网。

PDF 示例使用真实样例文件：

```text
test/langchain_document_loader_demo/data/course_intro.pdf
```

简历 PDF 示例读取本机文件：

```text
/Users/huangjin/Downloads/简历模板.pdf
```
