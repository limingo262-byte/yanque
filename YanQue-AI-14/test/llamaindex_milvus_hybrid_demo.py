"""LlamaIndex + Milvus 混合检索练习脚本。

运行前准备：
  1. 启动 Milvus，本地默认地址 http://localhost:19530
  2. 在 .env 中配置 DASHSCOPE_API_KEY
  3. 确认 pyproject.toml 中已经安装：
     - llama-index-core
     - llama-index-embeddings-openai
     - llama-index-vector-stores-milvus

运行：
  uv run python test/llamaindex_milvus_hybrid_demo.py

这个 demo 重点演示：
  1. LlamaIndex 仍然负责 Document -> Node -> VectorStoreIndex -> Retriever。
  2. MilvusVectorStore 同时开启 dense embedding 和 sparse BM25。
  3. Retriever 用 HYBRID 模式查询时，底层会走 Milvus hybrid_search。
"""

from __future__ import annotations

import os
from dataclasses import dataclass, replace

from dotenv import load_dotenv
from llama_index.core import Document, Settings, StorageContext, VectorStoreIndex
from llama_index.core.node_parser import MarkdownNodeParser, SentenceSplitter
from llama_index.core.schema import (
    BaseNode,
    MetadataMode,
    NodeRelationship,
    RelatedNodeInfo,
    TextNode,
)
from llama_index.core.vector_stores.types import VectorStoreQueryMode
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.milvus import MilvusVectorStore
from llama_index.vector_stores.milvus.utils import BM25BuiltInFunction


load_dotenv()

DEFAULT_BAILIAN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"


@dataclass(frozen=True)
class LlamaIndexMilvusHybridConfig:
    milvus_uri: str
    milvus_token: str | None
    milvus_db_name: str
    milvus_collection_name: str
    dense_metric_type: str
    embedding_api_key: str
    embedding_base_url: str
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    similarity_top_k: int


def load_config() -> LlamaIndexMilvusHybridConfig:
    """从环境变量读取 Milvus、Embedding 和切分配置。"""
    api_key = (
        os.getenv("DASHSCOPE_API_KEY")
        or os.getenv("BAILIAN_API_KEY")
        or ""
    ).strip()
    if not api_key:
        raise RuntimeError("请先在 .env 中配置 DASHSCOPE_API_KEY")

    return LlamaIndexMilvusHybridConfig(
        milvus_uri=os.getenv("MILVUS_URI", "http://124.223.194.220:19530"),
        milvus_token=os.getenv("MILVUS_TOKEN") or None,
        milvus_db_name=os.getenv("MILVUS_DB_NAME", "default"),
        milvus_collection_name=os.getenv(
            "LLAMAINDEX_HYBRID_MILVUS_COLLECTION",
            "course_knowledge_llamaindex_hybrid_demo_14",
        ),
        dense_metric_type=os.getenv("MILVUS_DENSE_METRIC_TYPE", "COSINE"),
        embedding_api_key=api_key,
        embedding_base_url=os.getenv("BAILIAN_BASE_URL", DEFAULT_BAILIAN_BASE_URL),
        embedding_model=os.getenv("BAILIAN_EMBEDDING_MODEL", "text-embedding-v4"),
        chunk_size=int(os.getenv("LLAMAINDEX_HYBRID_CHUNK_SIZE", "120")),
        chunk_overlap=int(os.getenv("LLAMAINDEX_HYBRID_CHUNK_OVERLAP", "20")),
        similarity_top_k=int(os.getenv("LLAMAINDEX_HYBRID_TOP_K", "3")),
    )


def print_title(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def build_demo_document() -> Document:
    """准备一份混合检索示例文档。"""
    markdown = """
# 第四天 LlamaIndex 与 Milvus 混合检索

## VectorStoreIndex

VectorStoreIndex 是 LlamaIndex 里组织文档入库和查询的核心对象。
它会把 Node 交给 Embedding 模型生成稠密向量，再通过 VectorStore 写入向量数据库。

## Retriever

Retriever 负责根据用户问题召回相关 Node。
当 VectorStore 支持不同查询模式时，Retriever 可以指定 DEFAULT、SPARSE 或 HYBRID 等模式。

## Milvus 混合检索

Milvus 混合检索会同时使用 dense_vector 和 sparse_vector。
dense_vector 适合语义相似，sparse_vector 适合关键词、专有名词、课程术语和编号。

## BM25 稀疏向量

BM25 是经典关键词检索算法。
在 Milvus 中可以通过 BM25 Function 根据文本字段自动生成 sparse_vector。

## Ranker 融合排序

RRFRanker 会按照两路召回结果的排名进行融合。
WeightedRanker 会按照 dense 和 sparse 的权重融合分数。

## 课程作业

课程作业需要在每周日晚上十点前提交。
如果作业提交失败，可以先检查账号登录状态，再联系班主任处理。
"""

    return Document(
        text=markdown.strip(),
        id_="course_day4_llamaindex_milvus_hybrid",
        metadata={
            "knowledge_base_id": "kb_course_demo",
            "document_id": "doc_day4_llamaindex_milvus_hybrid",
            "document_name": "第四天 LlamaIndex 与 Milvus 混合检索.md",
            "source": "llamaindex_milvus_hybrid_demo",
        },
    )


def split_document(
    document: Document,
    config: LlamaIndexMilvusHybridConfig,
) -> list[BaseNode]:
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
            node = TextNode(
                id_=f"{document.id_}_{markdown_index}_{part_index}",
                text=part,
                metadata={
                    **markdown_node.metadata,
                    "markdown_node_index": markdown_index,
                    "chunk_index": len(nodes),
                },
                # MilvusVectorStore 写入 Milvus 时，会把这个来源 ID 写到 doc_id 字段。
                relationships={
                    NodeRelationship.SOURCE: RelatedNodeInfo(node_id=document.id_),
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


def create_embed_model(config: LlamaIndexMilvusHybridConfig) -> OpenAIEmbedding:
    """创建百炼 OpenAI 兼容 Embedding。"""
    return OpenAIEmbedding(
        model_name=config.embedding_model,
        api_key=config.embedding_api_key,
        api_base=config.embedding_base_url,
    )


def create_hybrid_vector_store(
    embed_model: OpenAIEmbedding,
    config: LlamaIndexMilvusHybridConfig,
    *,
    overwrite: bool,
    hybrid_ranker: str,
    hybrid_ranker_params: dict,
) -> MilvusVectorStore:
    """创建同时支持 dense 和 sparse 的 MilvusVectorStore。"""
    vector_dim = len(embed_model.get_text_embedding("探测 Embedding 向量维度"))

    # 显式传 BM25BuiltInFunction，是为了给中文文本配置 analyzer。
    # 如果不传，MilvusVectorStore 默认也会用 BM25，但中文分词效果不一定适合课堂例子。
    sparse_embedding_function = BM25BuiltInFunction(
        input_field_names="text",
        output_field_names="sparse_vector",
        analyzer_params={"type": "chinese"},
    )

    return MilvusVectorStore(
        uri=config.milvus_uri,
        token=config.milvus_token or "",
        db_name=config.milvus_db_name,
        collection_name=config.milvus_collection_name,
        overwrite=overwrite,
        enable_dense=True,
        enable_sparse=True,
        dim=vector_dim,
        similarity_metric=config.dense_metric_type,
        embedding_field="dense_vector",
        sparse_embedding_field="sparse_vector",
        sparse_embedding_function=sparse_embedding_function,
        index_config={
            "index_type": "AUTOINDEX",
            "metric_type": config.dense_metric_type,
        },
        sparse_index_config={
            "index_type": "SPARSE_INVERTED_INDEX",
            "metric_type": "BM25",
            "inverted_index_algo": "DAAT_MAXSCORE",
            "bm25_k1": 1.2,
            "bm25_b": 0.75,
        },
        text_key="text",
        hybrid_ranker=hybrid_ranker,
        hybrid_ranker_params=hybrid_ranker_params,
        use_async_client=False,
    )


def build_index(
    nodes: list[BaseNode],
    embed_model: OpenAIEmbedding,
    vector_store: MilvusVectorStore,
    config: LlamaIndexMilvusHybridConfig,
) -> VectorStoreIndex:
    """入库：LlamaIndex 负责向量化，Milvus 同时生成 BM25 sparse_vector。"""
    print_title("2. 入库：VectorStoreIndex -> Milvus dense + sparse")
    print("Milvus 地址：", config.milvus_uri)
    print("Milvus Collection：", config.milvus_collection_name)
    print("Embedding 模型：", embed_model.model_name)
    print("dense 字段：dense_vector")
    print("sparse 字段：sparse_vector，由 Milvus BM25 Function 根据 text 自动生成")

    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex(
        nodes,
        embed_model=embed_model,
        storage_context=storage_context,
        show_progress=True,
    )

    print("索引构建完成。")
    return index


def print_hits(title: str, hits: list) -> None:
    """统一打印 LlamaIndex Retriever 命中结果。"""
    print_title(title)
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


def rebuild_index_from_vector_store(
    embed_model: OpenAIEmbedding,
    config: LlamaIndexMilvusHybridConfig,
    *,
    hybrid_ranker: str,
    hybrid_ranker_params: dict,
) -> VectorStoreIndex:
    """查询：从已有 Milvus collection 重新构建 LlamaIndex 查询入口。"""
    vector_store = create_hybrid_vector_store(
        embed_model,
        config,
        overwrite=False,
        hybrid_ranker=hybrid_ranker,
        hybrid_ranker_params=hybrid_ranker_params,
    )
    return VectorStoreIndex.from_vector_store(
        vector_store,
        embed_model=embed_model,
    )


def retrieve_with_modes(
    embed_model: OpenAIEmbedding,
    config: LlamaIndexMilvusHybridConfig,
) -> None:
    """分别演示 dense、sparse 和 hybrid 三种 Retriever 查询模式。"""
    semantic_question = "LlamaIndex 里面负责组织入库和查询的是哪个对象？"
    keyword_question = "BM25 sparse_vector 是怎么生成的？"

    index = rebuild_index_from_vector_store(
        embed_model,
        config,
        hybrid_ranker="RRFRanker",
        hybrid_ranker_params={"k": 60},
    )

    dense_retriever = index.as_retriever(
        similarity_top_k=config.similarity_top_k,
        vector_store_query_mode=VectorStoreQueryMode.DEFAULT,
    )
    print("Dense 问题：", semantic_question)
    print_hits(
        "3. Dense 检索：DEFAULT，只查 dense_vector",
        dense_retriever.retrieve(semantic_question),
    )

    sparse_retriever = index.as_retriever(
        similarity_top_k=config.similarity_top_k,
        vector_store_query_mode=VectorStoreQueryMode.SPARSE,
    )
    print("Sparse 问题：", keyword_question)
    print_hits(
        "4. Sparse 检索：SPARSE，只查 BM25 sparse_vector",
        sparse_retriever.retrieve(keyword_question),
    )

    hybrid_retriever = index.as_retriever(
        similarity_top_k=config.similarity_top_k,
        vector_store_query_mode=VectorStoreQueryMode.HYBRID,
    )
    print("Hybrid 问题：", semantic_question)
    print_hits(
        "5. Hybrid 检索：HYBRID，同时查 dense_vector + sparse_vector",
        hybrid_retriever.retrieve(semantic_question),
    )


def retrieve_with_weighted_ranker(
    embed_model: OpenAIEmbedding,
    nodes: list[BaseNode],
    config: LlamaIndexMilvusHybridConfig,
) -> None:
    """重新建一个 WeightedRanker 版本，和默认 RRF 做对比。"""
    weighted_collection = f"{config.milvus_collection_name}_weighted"
    weighted_config = replace(
        config,
        milvus_collection_name=weighted_collection,
    )
    vector_store = create_hybrid_vector_store(
        embed_model,
        weighted_config,
        overwrite=True,
        hybrid_ranker="WeightedRanker",
        hybrid_ranker_params={"weights": [0.7, 0.3]},
    )
    index = build_index(nodes, embed_model, vector_store, weighted_config)

    question = "LlamaIndex 里面负责组织入库和查询的是哪个对象？"
    retriever = index.as_retriever(
        similarity_top_k=config.similarity_top_k,
        vector_store_query_mode=VectorStoreQueryMode.HYBRID,
    )
    print("Weighted Hybrid 问题：", question)
    print_hits(
        "6. Hybrid 检索：WeightedRanker，dense 0.7 + sparse 0.3",
        retriever.retrieve(question),
    )


def main() -> None:
    config = load_config()

    # 这个 demo 只练检索，不让 LlamaIndex 自动去找默认 LLM。
    Settings.llm = None

    embed_model = create_embed_model(config)
    document = build_demo_document()
    nodes = split_document(document, config)

    rrf_vector_store = create_hybrid_vector_store(
        embed_model,
        config,
        overwrite=True,
        hybrid_ranker="RRFRanker",
        hybrid_ranker_params={"k": 60},
    )
    build_index(nodes, embed_model, rrf_vector_store, config)


    retrieve_with_modes(embed_model, config)

    retrieve_with_weighted_ranker(embed_model, nodes, config)

    print_title("7. 测试结束")
    print("RRF Collection：", config.milvus_collection_name)
    print("Weighted Collection：", f"{config.milvus_collection_name}_weighted")
    print("可以打开 Attu，观察 text、dense_vector、sparse_vector 字段。")


if __name__ == "__main__":
    main()
