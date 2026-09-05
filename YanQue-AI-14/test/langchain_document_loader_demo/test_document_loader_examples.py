import importlib
import unittest


text_loader_demo = importlib.import_module(
    "test.langchain_document_loader_demo.01_text_loader_demo"
)
pdf_loader_demo = importlib.import_module(
    "test.langchain_document_loader_demo.02_pdf_loader_demo"
)
web_loader_demo = importlib.import_module(
    "test.langchain_document_loader_demo.03_web_base_loader_demo"
)
text_splitter_demo = importlib.import_module(
    "test.langchain_document_loader_demo.04_text_splitter_demo"
)
pdf_splitter_demo = importlib.import_module(
    "test.langchain_document_loader_demo.05_pdf_load_and_split_demo"
)
resume_pdf_demo = importlib.import_module(
    "test.langchain_document_loader_demo.06_resume_pdf_loader_demo"
)


class DocumentLoaderExampleTest(unittest.TestCase):
    def test_text_loader_reads_txt(self):
        docs = text_loader_demo.load_text_documents()

        self.assertEqual(len(docs), 1)
        self.assertIn("RAG", docs[0].page_content)
        self.assertTrue(docs[0].metadata["source"].endswith("course_knowledge.txt"))

    def test_pdf_loader_reads_pdf_text(self):
        docs = pdf_loader_demo.load_pdf_documents()

        self.assertEqual(len(docs), 1)
        self.assertIn("Document loader reads PDF text", docs[0].page_content)
        self.assertIn("page", docs[0].metadata)

    def test_web_base_loader_reads_local_page(self):
        docs = web_loader_demo.load_web_documents()

        self.assertEqual(len(docs), 1)
        self.assertIn("YanQue AI 课程帮助", docs[0].page_content)
        self.assertIn("source", docs[0].metadata)

    def test_text_splitter_creates_chunks(self):
        chunks = text_splitter_demo.split_text_documents()

        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(chunk.page_content for chunk in chunks))
        self.assertTrue(all("source" in chunk.metadata for chunk in chunks))

    def test_pdf_load_and_split_creates_chunks(self):
        chunks = pdf_splitter_demo.load_and_split_pdf_documents()

        self.assertGreaterEqual(len(chunks), 1)
        self.assertIn("YanQue AI Course Intro", chunks[0].page_content)
        self.assertIn("page", chunks[0].metadata)

    def test_resume_pdf_loader_reads_real_pdf(self):
        docs = resume_pdf_demo.load_resume_pdf_documents()

        self.assertGreaterEqual(len(docs), 1)
        self.assertTrue(all("source" in doc.metadata for doc in docs))
        self.assertTrue(docs[0].metadata["source"].endswith("简历模板.pdf"))


if __name__ == "__main__":
    unittest.main()
