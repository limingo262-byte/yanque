"""LlamaIndex 核心流程练习脚本。

运行前准备：
  1. 在 .env 中配置 DASHSCOPE_API_KEY
  2. 确认 pyproject.toml 中已经安装 llama-index-core 和 llama-index-embeddings-openai

运行：
  uv run python test/llamaindex_core_demo.py

这个 demo 直接把 LlamaIndex 生成的向量写入 Milvus。
Milvus 的底层 CRUD、稀疏向量和混合检索练习继续看：
  - test/milvus_crud_demo.py
  - test/milvus_sparse_hybrid_demo.py
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv
from llama_index.core import Document, Settings, StorageContext, VectorStoreIndex
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core.node_parser import MarkdownNodeParser, SentenceSplitter
from llama_index.core.schema import (
    BaseNode,
    MetadataMode,
    NodeRelationship,
    RelatedNodeInfo,
    TextNode,
)
from llama_index.vector_stores.milvus import MilvusVectorStore


load_dotenv()

DEFAULT_BAILIAN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"


@dataclass(frozen=True)
class LlamaIndexDemoConfig:
    milvus_uri: str
    milvus_token: str | None
    milvus_db_name: str
    milvus_collection_name: str
    milvus_metric_type: str
    embedding_api_key: str
    embedding_base_url: str
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    similarity_top_k: int


def load_config() -> LlamaIndexDemoConfig:
    """从环境变量读取 Embedding 和切分配置。"""
    api_key = (
        os.getenv("DASHSCOPE_API_KEY")
        or os.getenv("BAILIAN_API_KEY")
        or ""
    ).strip()
    if not api_key:
        raise RuntimeError("请先在 .env 中配置 DASHSCOPE_API_KEY")

    return LlamaIndexDemoConfig(
        milvus_uri=os.getenv("MILVUS_URI", "http://124.223.194.220:19530"),
        milvus_token=os.getenv("MILVUS_TOKEN") or None,
        milvus_db_name=os.getenv("MILVUS_DB_NAME", "default"),
        milvus_collection_name=os.getenv(
            "LLAMAINDEX_DEMO_MILVUS_COLLECTION",
            "course_knowledge_llamaindex_demo_14",
        ),
        milvus_metric_type=os.getenv("LLAMAINDEX_DEMO_MILVUS_METRIC_TYPE", "COSINE"),
        embedding_api_key=api_key,
        embedding_base_url=os.getenv("BAILIAN_BASE_URL", DEFAULT_BAILIAN_BASE_URL),
        embedding_model=os.getenv("BAILIAN_EMBEDDING_MODEL", "text-embedding-v4"),
        chunk_size=int(os.getenv("LLAMAINDEX_DEMO_CHUNK_SIZE", "120")),
        chunk_overlap=int(os.getenv("LLAMAINDEX_DEMO_CHUNK_OVERLAP", "20")),
        similarity_top_k=int(os.getenv("LLAMAINDEX_DEMO_TOP_K", "3")),
    )


def print_title(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def build_demo_document() -> Document:
    """准备一份 Markdown 课程资料，模拟后台上传进来的知识库文档。"""
    markdown = """
# 第四天 LlamaIndex 知识库问答

## LlamaIndex 是什么

LlamaIndex 是一个用来组织 RAG 流程的框架。
它可以帮助我们读取资料、切分资料、生成向量、构建索引，并在用户提问时检索相关片段。

## Document 和 Node

Document 表示一整份原始资料，比如一篇 Markdown 文档。
Node 表示 Document 切分后的片段，真正参与向量化和检索的通常是 Node。

## VectorStoreIndex

VectorStoreIndex 会遍历 Node，调用 Embedding 模型生成向量，并把向量和文本组织成可以检索的索引。
它不是 Milvus 里的底层索引，而是 LlamaIndex 里组织入库和查询的对象。

## Retriever

Retriever 只负责检索。
用户提问后，Retriever 会把问题转成向量，再从索引里找最相似的 Node。

## 课程作业

课程作业需要在每周日晚上十点前提交。
如果作业提交失败，可以先检查账号登录状态，再联系班主任处理。
"""

    return Document(
        text=markdown.strip(),
        id_="course_day4_llamaindex",
        metadata={
            "knowledge_base_id": "kb_course_demo",
            "document_id": "doc_day4_llamaindex",
            "document_name": "第四天 LlamaIndex 知识库问答.md",
            "source": "llamaindex_core_demo",
        },
    )


def build_text_node(
    *,
    node_id: str,
    text: str,
    document: Document,
    metadata: dict,
) -> TextNode:
    """创建一个保留原始文档来源的 TextNode。"""
    return TextNode(
        id_=node_id,
        text=text,
        metadata=metadata,
        # 告诉 LlamaIndex：这个切片来自哪一份原始 Document。
        # MilvusVectorStore 写入 Milvus 时，会把这个来源 ID 写到 doc_id 字段。
        relationships={
            NodeRelationship.SOURCE: RelatedNodeInfo(node_id=document.id_),
        },
    )


def split_document(document: Document, config: LlamaIndexDemoConfig) -> list[BaseNode]:
    """先按 Markdown 标题切，再把过长片段按句子继续切小。"""
    print_title("1. Document -> Node")
    markdown_parser = MarkdownNodeParser()
    sentence_splitter = SentenceSplitter(
        chunk_size=config.chunk_size,
        chunk_overlap=config.chunk_overlap,
    )

    markdown_nodes = markdown_parser.get_nodes_from_documents([document])
    nodes: list[BaseNode] = []

    for markdown_index, markdown_node in enumerate(markdown_nodes, start=1):
        text = markdown_node.get_content(metadata_mode=MetadataMode.NONE)
        parts = sentence_splitter.split_text(text)

        for part_index, part in enumerate(parts, start=1):
            node = build_text_node(
                node_id=f"{document.id_}_{markdown_index}_{part_index}",
                text=part,
                document=document,
                metadata={
                    **markdown_node.metadata,
                    "markdown_node_index": markdown_index,
                    "chunk_index": len(nodes),
                },
            )
            nodes.append(node)

    print("原始 Document ID：", document.id_)
    print("Markdown 一级切分数量：", len(markdown_nodes))
    print("最终 Node 数量：", len(nodes))
    for node in nodes:
        print(
            {
                "node_id": node.node_id,
                "chunk_index": node.metadata["chunk_index"],
                "text": node.get_content(metadata_mode=MetadataMode.NONE)[:80],
            }
        )

    return nodes


def build_index(
    nodes: list[BaseNode],
    embed_model: OpenAIEmbedding,
    config: LlamaIndexDemoConfig,
) -> VectorStoreIndex:
    """入库：把 Node 向量化后写入 vector_store。"""
    print_title("2. 入库：Node -> VectorStoreIndex -> Milvus")
    print("Milvus 地址：", config.milvus_uri)
    print("Milvus Collection：", config.milvus_collection_name)
    print("Embedding 模型：", embed_model.model_name)
    print("这里会把每个 Node 文本转成向量，并写入 Milvus。")

    # Milvus 创建向量字段时必须提前知道维度。
    # 这里先用同一个 Embedding 模型随便转一小段文本，只为了拿到向量长度。
    # 比如 text-embedding-v4 当前返回 1024 维，那么下面 dim 就要传 1024。
    vector_dim = 1024

    # MilvusVectorStore 是 LlamaIndex 官方提供的 Milvus 适配器。
    # 它不是 Milvus 里的“索引算法”，而是 LlamaIndex 连接 Milvus 的工具。
    # 后面 VectorStoreIndex 写入 Node 时，底层会通过这个对象把数据写进 Milvus。
    vector_store = MilvusVectorStore(
        # Milvus 服务地址和认证信息。
        uri=config.milvus_uri,
        token=config.milvus_token or "",
        db_name=config.milvus_db_name,
        # Collection 可以理解成 Milvus 里的一张表。
        collection_name=config.milvus_collection_name,
        # demo 每次运行都重建 Collection，避免旧数据影响课堂观察。
        # 生产环境一般不要随便 overwrite=True。
        overwrite=True,
        # 向量字段维度，必须和 Embedding 模型输出维度一致。
        dim=vector_dim,
        # 相似度算法。文本 Embedding 通常用 COSINE。
        similarity_metric=config.milvus_metric_type,
        # Milvus 里保存稠密向量的字段名。
        embedding_field="vector",
        # Milvus 里保存 Node 原文的字段名。
        # 这里用默认的 text，更贴近 LlamaIndex 内部 TextNode 的字段。
        text_key="text",
        # 这个 demo 不演示异步客户端，先关掉，调试输出更直观。
        use_async_client=False,
    )


    # StorageContext 告诉 LlamaIndex：向量不要存在默认内存里，要写到上面的 MilvusVectorStore。
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # VectorStoreIndex 是入库入口。
    # 它会遍历 nodes，调用 embed_model 生成向量，然后通过 storage_context 写入 Milvus。
    index = VectorStoreIndex(
        nodes,
        embed_model=embed_model,
        storage_context=storage_context,
        show_progress=True,
    )

    print("索引构建完成。")
    return index


def retrieve_from_index(
    embed_model: OpenAIEmbedding,
    config: LlamaIndexDemoConfig,
) -> None:


    """从已有 vector_store 构建查询入口，再使用 Retriever 检索。"""
    print_title("3. 查询：VectorStoreIndex.from_vector_store -> Retriever")
    question = "LlamaIndex 里面负责组织入库和查询的是哪个对象？"

    # 这里不再传 nodes，也不复用前面入库时创建的 VectorStoreIndex。
    # 它表示：向量数据已经在 Milvus 里了，现在只重新构建一个查询入口。

    vector_store = MilvusVectorStore(
        # Milvus 服务地址和认证信息。
        uri=config.milvus_uri,
        token=config.milvus_token or "",
        db_name=config.milvus_db_name,
        # Collection 可以理解成 Milvus 里的一张表。
        collection_name=config.milvus_collection_name,
        # 查询已有 Collection 时不能 overwrite=True，否则会把第 2 步刚写入的数据清空。
        overwrite=False,
        # 向量字段维度，必须和 Embedding 模型输出维度一致。
        dim=1024,
        # 相似度算法。文本 Embedding 通常用 COSINE。
        similarity_metric=config.milvus_metric_type,
        # Milvus 里保存稠密向量的字段名。
        embedding_field="vector",
        # Milvus 里保存 Node 原文的字段名。
        # 这里用默认的 text，更贴近 LlamaIndex 内部 TextNode 的字段。
        text_key="text",
        # 这个 demo 不演示异步客户端，先关掉，调试输出更直观。
        use_async_client=False,
    )


    # 告诉llamaIndex 数据库的配置
    query_index = VectorStoreIndex.from_vector_store(
        vector_store,
        embed_model=embed_model,
    )

    # 告诉llamaIndex 检索要求
    retriever = query_index.as_retriever(similarity_top_k=config.similarity_top_k)

    # 开始检索
    hits = retriever.retrieve(question)

    print("问题：", question)
    print("返回数量：", len(hits))
    for hit in hits:
        node = hit.node
        print(
            {
                "score": hit.score,
                "node_id": node.node_id,
                "chunk_index": node.metadata.get("chunk_index"),
                "document_name": node.metadata.get("document_name"),
                "text": node.get_content(metadata_mode=MetadataMode.NONE),
            }
        )


def main() -> None:
    config = load_config()

    # 这个 demo 只练检索，不让 LlamaIndex 自动去找默认 LLM。
    Settings.llm = None

    embed_model = OpenAIEmbedding(
        model_name=config.embedding_model,
        api_key=config.embedding_api_key,
        api_base=config.embedding_base_url,
    )

    document = build_demo_document()

    nodes = split_document(document, config)

    build_index(nodes, embed_model, config)


    retrieve_from_index(embed_model, config)

    print_title("4. 测试结束")
    print("可以打开 Attu，查看 Collection：", config.milvus_collection_name)


if __name__ == "__main__":
    main()
