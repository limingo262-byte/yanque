"""Milvus 稀疏向量检索与混合检索练习脚本。

运行前准备：
  1. 启动 Milvus，本地默认地址 http://localhost:19530
  2. 在 .env 中配置 DASHSCOPE_API_KEY

运行：
  uv run python test/milvus_sparse_hybrid_demo.py

这个 demo 重点演示：
  1. dense_vector：稠密向量，用 Embedding 模型生成，适合语义检索。
  2. sparse_vector：稀疏向量，由 Milvus BM25 Function 自动生成。
  3. hybrid_search：同时查 dense_vector 和 sparse_vector，再融合排序。
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI
from pymilvus import (
    AnnSearchRequest,
    DataType,
    Function,
    FunctionType,
    MilvusClient,
    RRFRanker,
    WeightedRanker,
)


load_dotenv()

DEFAULT_BAILIAN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
DEFAULT_COLLECTION_NAME = "course_knowledge_sparse_hybrid_demo_14"


@dataclass(frozen=True)
class MilvusSparseHybridConfig:
    uri: str
    token: str | None
    db_name: str
    collection_name: str
    dense_metric_type: str
    sparse_metric_type: str
    embedding_api_key: str
    embedding_base_url: str
    embedding_model: str


def load_config() -> MilvusSparseHybridConfig:
    """从环境变量读取 Milvus 和 Embedding 配置。"""
    api_key = (
        os.getenv("DASHSCOPE_API_KEY")
        or os.getenv("BAILIAN_API_KEY")
        or ""
    ).strip()
    if not api_key:
        raise RuntimeError("请先在 .env 中配置 DASHSCOPE_API_KEY")

    return MilvusSparseHybridConfig(
        uri=os.getenv("MILVUS_URI", "http://124.223.194.220:19530"),
        token=os.getenv("MILVUS_TOKEN") or None,
        db_name=os.getenv("MILVUS_DB_NAME", "default"),
        collection_name=os.getenv(
            "MILVUS_SPARSE_HYBRID_COLLECTION",
            DEFAULT_COLLECTION_NAME,
        ),
        dense_metric_type=os.getenv("MILVUS_DENSE_METRIC_TYPE", "COSINE"),
        sparse_metric_type=os.getenv("MILVUS_SPARSE_METRIC_TYPE", "BM25"),
        embedding_api_key=api_key,
        embedding_base_url=os.getenv("BAILIAN_BASE_URL", DEFAULT_BAILIAN_BASE_URL),
        embedding_model=os.getenv("BAILIAN_EMBEDDING_MODEL", "text-embedding-v4"),
    )


def print_title(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def connect_client(config: MilvusSparseHybridConfig) -> MilvusClient:
    """连接 Milvus。"""
    print_title("1. 连接 Milvus")
    print("Milvus 地址：", config.uri)
    print("数据库：", config.db_name)

    if config.token:
        client = MilvusClient(
            uri=config.uri,
            token=config.token,
            db_name=config.db_name,
        )
    else:
        client = MilvusClient(uri=config.uri, db_name=config.db_name)

    print("当前已有 Collection：", client.list_collections())
    return client


def debug_analyzer(client: MilvusClient) -> None:
    """查看中文 analyzer 会把查询词切成什么 token。"""
    if not hasattr(client, "run_analyzer"):
        return

    print_title("中文分词调试")
    analyzer_params = {"type": "chinese"}
    for text in ["课程作业", "VectorStoreIndex 是什么？"]:
        try:
            tokens = client.run_analyzer(text, analyzer_params)
        except Exception as exc:
            print(f"run_analyzer 不可用，跳过分词调试：{exc}")
            return
        print(f"{text} -> {tokens}")


def create_embedding_client(config: MilvusSparseHybridConfig) -> OpenAI:
    """创建百炼 OpenAI 兼容 Embedding 客户端。"""
    return OpenAI(
        api_key=config.embedding_api_key,
        base_url=config.embedding_base_url,
    )


def embed_texts(
    embedding_client: OpenAI,
    config: MilvusSparseHybridConfig,
    texts: list[str],
) -> list[list[float]]:
    """把文本转成稠密向量。"""
    response = embedding_client.embeddings.create(
        model=config.embedding_model,
        input=texts,
    )

    vectors = [item.embedding for item in response.data]
    if len(vectors) != len(texts):
        raise RuntimeError("Embedding 返回数量和输入文本数量不一致")
    return vectors


def recreate_collection(
    client: MilvusClient,
    config: MilvusSparseHybridConfig
) -> None:
    """重建 Collection，包含 dense_vector 和 sparse_vector 两个向量字段。"""
    print_title("2. 创建 Collection：dense_vector + sparse_vector")

    if client.has_collection(collection_name=config.collection_name):
        print(f"Collection 已存在，先删除：{config.collection_name}")
        client.drop_collection(collection_name=config.collection_name)

    schema = MilvusClient.create_schema(
        auto_id=False,
        enable_dynamic_field=False,
    )

    # id 是主键。auto_id=False 表示主键由我们自己传入，方便课堂上观察每条 chunk。
    schema.add_field(field_name="id", datatype=DataType.INT64, is_primary=True)

    # dense_vector 是稠密向量字段。
    # 它存的是 Embedding 模型生成的一长串小数，用来做“语义相似”检索。
    # dim 必须和 Embedding 模型返回的维度一致。
    schema.add_field(
        field_name="dense_vector",
        datatype=DataType.FLOAT_VECTOR,
        dim=1024,
    )

    # sparse_vector 是稀疏向量字段。
    # 它不需要 dim，因为稀疏向量只保存“非 0 的词项ID和权重”。
    # 这个字段由下面的 BM25 Function 自动生成，所以 Attu 里会显示“系统生成”。
    schema.add_field(
        field_name="sparse_vector",
        datatype=DataType.SPARSE_FLOAT_VECTOR,
    )

    # content 保存 chunk 原文。
    # enable_analyzer=True 很关键：Milvus 需要先对原文分词，BM25 才能统计词频和相关性。
    # analyzer_params={"type": "chinese"} 表示使用中文分析器，底层会用 jieba 做中文分词。
    # 如果不配置中文 analyzer，中文查询如“课程作业”可能切不出能命中文档的词，BM25 就查不到。
    schema.add_field(
        field_name="content",
        datatype=DataType.VARCHAR,
        max_length=1024,
        enable_analyzer=True,
        analyzer_params={"type": "chinese"},
    )

    # metadata 保存业务信息。真实项目里可以放 knowledge_base_id、document_id、权限范围等。
    schema.add_field(field_name="metadata", datatype=DataType.JSON)

    # BM25 Function 的作用：
    #   输入：content 原文
    #   输出：sparse_vector 稀疏向量
    #
    # 有了这段配置，插入数据时不用自己计算 sparse_vector；
    # Milvus 会在写入 content 时自动生成 sparse_vector。
    schema.add_function(
        Function(
            name="content_bm25_function",
            function_type=FunctionType.BM25,
            input_field_names=["content"],
            output_field_names=["sparse_vector"],
        )
    )

    index_params = MilvusClient.prepare_index_params()

    # dense_vector 的索引用来加速语义检索。
    # 这里用 AUTOINDEX，表示先让 Milvus 自动选择索引策略，适合教学和早期 demo。
    index_params.add_index(
        field_name="dense_vector",
        index_type="AUTOINDEX",
        metric_type=config.dense_metric_type,
    )

    # sparse_vector 的索引用来加速 BM25 关键词检索。
    # SPARSE_INVERTED_INDEX 可以理解成“关键词 -> 包含这个词的文档列表”的倒排结构。
    index_params.add_index(
        field_name="sparse_vector",
        index_type="SPARSE_INVERTED_INDEX",
        metric_type=config.sparse_metric_type,
        params={
            # DAAT_MAXSCORE 是倒排检索时的一种执行策略，用来更快找到高分结果。
            "inverted_index_algo": "DAAT_MAXSCORE",
            # bm25_k1 控制词频对分数的影响：词出现更多次会加分，但不会无限加。
            "bm25_k1": 1.2,
            # bm25_b 控制文档长度归一化：避免长文档因为词多就天然占便宜。
            "bm25_b": 0.75,
        },
    )

    client.create_collection(
        collection_name=config.collection_name,
        schema=schema,
        index_params=index_params,
    )

    print("创建完成：", config.collection_name)
    print("字段：id, dense_vector, sparse_vector, content, metadata")
    print("BM25 Function：content -> sparse_vector")
    print("稠密向量索引：AUTOINDEX /", config.dense_metric_type)
    print("稀疏向量索引：SPARSE_INVERTED_INDEX /", config.sparse_metric_type)


def build_demo_rows(
    embedding_client: OpenAI,
    config: MilvusSparseHybridConfig,
) -> list[dict[str, Any]]:
    """准备课程知识库示例数据。"""
    contents = [
        "VectorStoreIndex 是 LlamaIndex 中用来组织文档入库和查询的核心对象。",
        "LlamaIndex 可以读取资料、切分 Node、连接 Milvus，并把检索结果组织进 Prompt。",
        "Milvus 的 HNSW 索引会把向量组织成近邻图，用来加速相似度检索。",
        "学生申请退课退款时，需要先提交订单号和退课原因。",
        "课程作业需要在每周日晚上十点前提交。",
        "账号登录失败时，可以先检查密码是否正确，或者联系班主任处理。",
    ]

    dense_vectors = embed_texts(embedding_client, config, contents)
    rows: list[dict[str, Any]] = []

    for index, content in enumerate(contents, start=1):
        rows.append(
            {
                "id": index,
                # 稠密向量需要我们调用 Embedding 模型生成后写入。
                "dense_vector": dense_vectors[index - 1],
                # 注意这里没有传 sparse_vector。
                # 因为 schema 里已经配置了 BM25 Function：
                # content 写入 Milvus 后，Milvus 会自动生成 sparse_vector。
                "content": content,
                "metadata": {
                    "source": "sparse_hybrid_demo.md",
                    "chunk_index": index - 1,
                },
            }
        )

    return rows


def insert_demo_data(
    client: MilvusClient,
    config: MilvusSparseHybridConfig,
    data: list[dict[str, Any]],
) -> None:
    """写入 demo 数据。"""
    print_title("3. 插入 demo 数据")
    result = client.insert(collection_name=config.collection_name, data=data)
    print("插入结果：", result)
    print("写入内容：")
    for row in data:
        print(
            {
                "id": row["id"],
                "content": row["content"],
                "sparse_vector": "由 Milvus BM25 Function 根据 content 自动生成",
            }
        )


def search_sparse_only(
    client: MilvusClient,
    config: MilvusSparseHybridConfig,
) -> None:
    """只查 sparse_vector，演示关键词检索。"""
    print_title("4. BM25 稀疏向量检索：只查关键词")
    question = "VectorStoreIndex 是什么？"

    print("问题：", question)
    print("查询方式：直接把原始文本交给 Milvus，BM25 Function 自动生成查询 sparse vector")

    results = client.search(
        collection_name=config.collection_name,
        # 因为 sparse_vector 是 BM25 Function 的输出字段，
        # 所以查询时可以直接传原始文本，Milvus 会自动转成查询侧 sparse vector。
        data=[question],
        # anns_field 指定本次搜索走哪个向量字段。
        # 这里只查 sparse_vector，所以演示的是关键词检索。
        anns_field="sparse_vector",
        search_params={"metric_type": config.sparse_metric_type, "params": {}},
        limit=3,
        output_fields=["content", "metadata"],
    )

    print("稀疏向量检索结果：")
    print_hits(results[0])


def search_hybrid_with_weighted_ranker(
    client: MilvusClient,
    embedding_client: OpenAI,
    config: MilvusSparseHybridConfig,
) -> None:
    """混合检索：WeightedRanker 按权重融合 dense 和 sparse 分数。"""
    print_title("5. 混合检索：WeightedRanker 加权融合")
    question = "LlamaIndex 里面负责组织入库和查询的是哪个对象？"

    # dense 这一路需要自己把问题转成稠密向量。
    dense_query_vector = embed_texts(embedding_client, config, [question])[0]

    # 第一路：语义检索，查 dense_vector。
    dense_request = AnnSearchRequest(
        data=[dense_query_vector],
        anns_field="dense_vector",
        param={"metric_type": config.dense_metric_type, "params": {}},
        limit=3,
    )

    # 第二路：关键词检索，查 sparse_vector。
    # sparse_vector 由 BM25 Function 生成，所以查询侧也直接传原始文本。
    sparse_request = AnnSearchRequest(
        data=[question],
        anns_field="sparse_vector",
        param={"metric_type": config.sparse_metric_type, "params": {}},
        limit=3,
    )

    results = client.hybrid_search(
        collection_name=config.collection_name,
        # reqs 里放两路召回请求：dense + sparse。
        reqs=[dense_request, sparse_request],
        # 第一个权重对应 dense_request，第二个权重对应 sparse_request。
        # 这里表示语义分更重要，但关键词命中也参与排序。
        ranker=WeightedRanker(0.7, 0.3),
        limit=3,
        output_fields=["content", "metadata"],
    )

    print("问题：", question)
    print("稀疏查询：Milvus BM25 Function 自动处理原始文本")
    print("加权融合结果：")
    print_hits(results[0])


def search_hybrid_with_rrf_ranker(
    client: MilvusClient,
    embedding_client: OpenAI,
    config: MilvusSparseHybridConfig,
) -> None:
    """混合检索：RRFRanker 按两路排名融合结果。"""
    print_title("6. 混合检索：RRFRanker 按排名融合")
    question = "Milvus 向量索引怎么加速检索？"
    dense_query_vector = embed_texts(embedding_client, config, [question])[0]

    # dense_request 和 sparse_request 仍然是两路召回。
    # 和 WeightedRanker 不同的是，RRFRanker 后面会按“排名”融合，而不是按原始分数加权。
    dense_request = AnnSearchRequest(
        data=[dense_query_vector],
        anns_field="dense_vector",
        param={"metric_type": config.dense_metric_type, "params": {}},
        limit=3,
    )
    sparse_request = AnnSearchRequest(
        data=[question],
        anns_field="sparse_vector",
        param={"metric_type": config.sparse_metric_type, "params": {}},
        limit=3,
    )

    results = client.hybrid_search(
        collection_name=config.collection_name,
        reqs=[dense_request, sparse_request],
        # k 是 RRF 公式里的平滑常数。
        # 课堂里不用死记公式，只要知道：两路都排得靠前的结果会更靠前。
        ranker=RRFRanker(k=60),
        limit=3,
        output_fields=["content", "metadata"],
    )

    print("问题：", question)
    print("稀疏查询：Milvus BM25 Function 自动处理原始文本")
    print("RRF 融合结果：")
    print_hits(results[0])


def print_hits(hits: list[dict[str, Any]]) -> None:
    """统一打印 search 命中结果。"""
    for hit in hits:
        entity = hit["entity"]
        metadata = entity["metadata"]
        print(
            {
                "id": hit["id"],
                "distance": hit["distance"],
                "content": entity["content"],
                "source": metadata["source"],
                "chunk_index": metadata["chunk_index"],
            }
        )


def prepare_demo_data(
    client: MilvusClient,
    embedding_client: OpenAI,
    config: MilvusSparseHybridConfig,
) -> None:
    """重建 collection 并插入 demo 数据。"""
    data = build_demo_rows(embedding_client, config)
    recreate_collection(client, config)
    insert_demo_data(client, config, data)


def main() -> None:
    config = load_config()
    client = connect_client(config)
    embedding_client = create_embedding_client(config)

    # debug_analyzer(client)
    prepare_demo_data(client, embedding_client, config)

    search_sparse_only(client, config)
    search_hybrid_with_weighted_ranker(client, embedding_client, config)
    search_hybrid_with_rrf_ranker(client, embedding_client, config)

    print_title("7. 测试结束")
    print("可以打开 Attu，查看 Collection：", config.collection_name)


if __name__ == "__main__":
    main()
