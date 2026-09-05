"""Milvus CRUD 与向量检索练习脚本。

运行前准备：
  1. 启动 Milvus，本地默认地址 http://localhost:19530
  2. 在 .env 中配置 DASHSCOPE_API_KEY

运行：
  uv run python test/milvus_crud_demo.py

想练哪一步，就在 main() 里取消对应代码注释。
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI
from pymilvus import DataType, MilvusClient


load_dotenv()

DEFAULT_BAILIAN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
DEFAULT_COLLECTION_NAME = "course_knowledge_crud_demo_14"


@dataclass(frozen=True)
class MilvusDemoConfig:
    uri: str
    token: str | None
    db_name: str
    collection_name: str
    metric_type: str
    embedding_api_key: str
    embedding_base_url: str
    embedding_model: str


def load_config() -> MilvusDemoConfig:
    """从环境变量读取 Milvus 和 Embedding 配置。"""
    api_key = (
        os.getenv("DASHSCOPE_API_KEY")
        or os.getenv("BAILIAN_API_KEY")
        or ""
    ).strip()
    if not api_key:
        raise RuntimeError("请先在 .env 中配置 DASHSCOPE_API_KEY")

    return MilvusDemoConfig(
        uri=os.getenv("MILVUS_URI", "http://124.223.194.220:19530"),
        token=os.getenv("MILVUS_TOKEN") or None,
        db_name=os.getenv("MILVUS_DB_NAME", "default"),
        collection_name=os.getenv("MILVUS_COLLECTION", DEFAULT_COLLECTION_NAME),
        metric_type=os.getenv("MILVUS_METRIC_TYPE", "COSINE"),
        embedding_api_key=api_key,
        embedding_base_url=os.getenv("BAILIAN_BASE_URL", DEFAULT_BAILIAN_BASE_URL),
        embedding_model=os.getenv("BAILIAN_EMBEDDING_MODEL", "text-embedding-v4"),
    )


def print_title(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def connect_client(config: MilvusDemoConfig) -> MilvusClient:
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


def create_embedding_client(config: MilvusDemoConfig) -> OpenAI:
    """创建百炼 OpenAI 兼容 Embedding 客户端。"""
    return OpenAI(
        api_key=config.embedding_api_key,
        base_url=config.embedding_base_url,
    )


def embed_texts(
    embedding_client: OpenAI,
    config: MilvusDemoConfig,
    texts: list[str],
) -> list[list[float]]:
    """把文本转成向量。"""
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
    config: MilvusDemoConfig,
    vector_dim: int,
) -> None:
    """重建 Collection，演示 schema 与 index 的创建。"""
    print_title("2. 创建 Collection")

    if client.has_collection(collection_name=config.collection_name):
        print(f"Collection 已存在，先删除：{config.collection_name}")
        client.drop_collection(collection_name=config.collection_name)

    # Collection 可以理解成 Milvus 里的“一张表”。
    # 创建 Collection 时，核心就是定义 schema：这张表有哪些字段，每个字段是什么类型。
    schema = MilvusClient.create_schema(
        # auto_id=False 表示主键 id 由我们自己传入。
        # 如果改成 True，Milvus 会自动生成主键，insert 时就不用传 id。
        auto_id=False,
        # enable_dynamic_field=False 表示只允许写入 schema 里声明过的字段。
        # 教学和业务项目里先关掉动态字段，字段结构更清楚，不容易写错。
        enable_dynamic_field=False,
    )

    # 主键字段：每条数据必须有唯一 id。
    # INT64 是最常见的主键类型，也可以用 VARCHAR 做字符串主键。
    schema.add_field(field_name="id", datatype=DataType.INT64, is_primary=True)

    # 向量字段：Milvus 之所以能做语义检索，靠的就是这个 FLOAT_VECTOR 字段。
    # dim 必须等于 embedding 模型返回的向量维度，比如 text-embedding-v4 返回多少维，
    # 这里就必须写多少维，否则 insert/search 会报维度不匹配。
    schema.add_field(
        field_name="vector",
        datatype=DataType.FLOAT_VECTOR,
        dim=vector_dim,
    )

    # 普通文本字段：保存原始知识内容。
    # Milvus 主要负责向量检索，不适合存超长正文；max_length 要按业务内容预估。
    schema.add_field(
        field_name="content",
        datatype=DataType.VARCHAR,
        max_length=1024,
    )

    # JSON 元数据字段：保存来源、分类、章节、课程 id 等附加信息。
    # 后面可以用 metadata["category"] == "补课规则" 这种表达式做过滤。
    schema.add_field(field_name="metadata", datatype=DataType.JSON)

    # index 是向量索引。没有索引也能查，但数据量大后会很慢。
    # 生产里常见索引有 HNSW、IVF_FLAT 等；这里用 AUTOINDEX 让 Milvus 自己选择合适策略。
    index_params = MilvusClient.prepare_index_params()
    index_params.add_index(
        field_name="vector",
        # AUTOINDEX：Milvus 自动选择和管理索引类型。
        # 练习和早期项目优先用它，少纠结参数；等数据量、性能要求明确后再手动选索引。
        index_type="AUTOINDEX",
        # COSINE 表示按余弦相似度比较两个向量方向是否接近。
        # 文本 embedding 做语义相似度时最常用 COSINE。
        metric_type=config.metric_type,
    )

    # 真正创建 Collection。
    # collection_name 是表名，schema 定义字段，index_params 定义向量字段怎么建索引。
    client.create_collection(
        collection_name=config.collection_name,
        schema=schema,
        index_params=index_params,
    )

    print("创建完成：", config.collection_name)
    print("字段：id, vector, content, metadata")
    print("Embedding 模型：", config.embedding_model)
    print("向量维度：", vector_dim)
    print("相似度计算：", config.metric_type)


def build_demo_rows(
    embedding_client: OpenAI,
    config: MilvusDemoConfig,
) -> list[dict[str, Any]]:
    """准备课程知识库示例数据。"""
    contents = [
        "学生请假后，可以在一周内联系老师安排补课。",
        "补课需要提前和班主任确认时间，避免和正常课程冲突。",
        "学生申请退费时，需要先提交订单号和退费原因。",
        "课程作业需要在每周日晚上十点前提交。",
    ]

    # 调用向量模型向量化
    vectors = embed_texts(embedding_client, config, contents)

    return [
        {
            "id": 1,
            "vector": vectors[0],
            "content": contents[0],
            "metadata": {"source": "course_knowledge.txt", "category": "补课规则"},
        },
        {
            "id": 2,
            "vector": vectors[1],
            "content": contents[1],
            "metadata": {"source": "course_knowledge.txt", "category": "补课规则"},
        },
        {
            "id": 3,
            "vector": vectors[2],
            "content": contents[2],
            "metadata": {"source": "course_knowledge.txt", "category": "退费规则"},
        },
        {
            "id": 4,
            "vector": vectors[3],
            "content": contents[3],
            "metadata": {"source": "course_knowledge.txt", "category": "作业规则"},
        },
    ]


def insert_demo_data(
    client: MilvusClient,
    config: MilvusDemoConfig,
    data: list[dict[str, Any]],
) -> None:
    """新增数据。"""
    print_title("3. 新增数据 insert")
    result = client.insert(collection_name=config.collection_name, data=data)
    print("插入结果：", result)


def query_all_data(client: MilvusClient, config: MilvusDemoConfig) -> None:
    """标量查询，适合按 id 或 metadata 精确筛选。"""
    print_title("4. 查询数据 query")
    rows = client.query(
        collection_name=config.collection_name,
        filter='id in [1, 2, 3, 4]',
        output_fields=["id", "content", "metadata"],
    )

    print("当前 Collection 中的数据：")
    for row in rows:
        print(row)


def query_by_metadata(client: MilvusClient, config: MilvusDemoConfig) -> None:
    """JSON metadata 条件查询。"""
    print_title("5. metadata 条件查询 query")
    rows = client.query(
        collection_name=config.collection_name,
        filter='metadata["category"] == "退费规则"',
        output_fields=["id", "content", "metadata"],
    )

    print('metadata["category"] == "退费规则" 的数据：')
    for row in rows:
        print(row)


def search_by_vector(
    client: MilvusClient,
    embedding_client: OpenAI,
    config: MilvusDemoConfig,
) -> None:
    """向量检索，适合语义相似问题召回。"""
    print_title("6. 向量检索 search")
    question = "学生请假后怎么补课？"
    query_vectors = embed_texts(embedding_client, config, [question])

    results = client.search(
        collection_name=config.collection_name,
        data=query_vectors,
        limit=2,
        output_fields=["content", "metadata"],
    )

    print("问题：", question)
    print("最相似的 2 条资料：")
    print_hits(results[0])


def search_with_filter(
    client: MilvusClient,
    embedding_client: OpenAI,
    config: MilvusDemoConfig,
) -> None:
    """向量检索 + metadata 过滤，RAG 里最常用。"""
    print_title("7. 带 metadata 条件过滤的向量检索")
    question = "学生请假后怎么补课？"
    query_vectors = embed_texts(embedding_client, config, [question])

    results = client.search(
        collection_name=config.collection_name,
        data=query_vectors,
        filter='metadata["category"] == "补课规则"',
        limit=2,
        output_fields=["content", "metadata"],
    )

    print("问题：", question)
    print('只在 metadata["category"] == "补课规则" 的资料中检索：')
    print_hits(results[0])


def update_demo_data(
    client: MilvusClient,
    embedding_client: OpenAI,
    config: MilvusDemoConfig,
) -> None:
    """upsert：主键存在则更新，不存在则插入。"""
    print_title("8. 修改数据 upsert")
    content = "补课需要提前联系班主任确认时间，并按照老师安排参加补课。"
    updated_row = {
        "id": 2,
        "vector": embed_texts(embedding_client, config, [content])[0],
        "content": content,
        "metadata": {"source": "course_knowledge_v2.txt", "category": "补课规则"},
    }

    result = client.upsert(
        collection_name=config.collection_name,
        data=[updated_row],
    )
    print("更新结果：", result)

    rows = client.query(
        collection_name=config.collection_name,
        filter="id == 2",
        output_fields=["id", "content", "metadata"],
    )
    print("更新后的 id=2：", rows)


def delete_demo_data(client: MilvusClient, config: MilvusDemoConfig) -> None:
    """删除数据。"""
    print_title("9. 删除数据 delete")
    result = client.delete(collection_name=config.collection_name, ids=[3])
    print("删除结果：", result)

    rows = client.query(
        collection_name=config.collection_name,
        filter="id in [1, 2, 3, 4]",
        output_fields=["id", "content", "metadata"],
    )
    print("删除 id=3 后剩余数据：")
    for row in rows:
        print(row)


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
                "category": metadata["category"],
            }
        )


def prepare_demo_data(
    client: MilvusClient,
    embedding_client: OpenAI,
    config: MilvusDemoConfig,
) -> None:
    """重建 collection 并插入 demo 数据。"""
    data = build_demo_rows(embedding_client, config)
    vector_dim = len(data[0]["vector"])
    recreate_collection(client, config, vector_dim)
    insert_demo_data(client, config, data)


def main() -> None:
    config = load_config()
    client = connect_client(config)
    embedding_client = create_embedding_client(config)

    # 第一次练习时，先打开这行：创建 collection，并插入 4 条 demo 数据。
    # 后面只想练 query/search/update/delete 时，可以把它注释掉，避免每次重建。
    prepare_demo_data(client, embedding_client, config)

    # 1. 普通查询：按 id 查数据。
    query_all_data(client, config)

    # 2. metadata 查询：按 JSON 字段过滤。
    query_by_metadata(client, config)

    # 3. 向量检索：把问题转向量，再查最相似资料。
    search_by_vector(client, embedding_client, config)

    # 4. 向量检索 + metadata 过滤：RAG 常用写法。
    search_with_filter(client, embedding_client, config)

    # 5. 更新数据：upsert 主键存在就是更新，不存在就是插入。
    update_demo_data(client, embedding_client, config)

    # 6. 删除数据：按主键删除。
    delete_demo_data(client, config)

    print_title("10. 测试结束")
    print("可以打开 Attu，查看 Collection：", config.collection_name)


if __name__ == "__main__":
    main()
