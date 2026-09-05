from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph


# 这个 demo 用模拟数据演示 Text-to-SQL 的 LangGraph 流程。
# 它不调用真实大模型，也不连接真实数据库。
# 重点是看清楚：
# 用户问题 -> 分类 -> 理解 -> 找 Schema -> 生成查询计划 -> 生成 SQL -> 安全校验 -> 模拟执行 -> 生成回答


class TextToSqlState(TypedDict, total=False):
    question: str
    request_type: str
    intent: dict[str, str]
    schemas: list[str]
    query_plan: dict[str, str]
    sql: str
    safe: bool
    rows: list[dict[str, object]]
    answer: str


def router_node(state: TextToSqlState) -> TextToSqlState:
    question = state["question"]

    if "修改" in question or "删除" in question or "改成" in question:
        request_type = "DATA_OPERATION"
    elif "看一下" in question:
        request_type = "AMBIGUOUS"
    elif "订单" in question or "统计" in question or "查询" in question:
        request_type = "DATA_QUERY"
    else:
        request_type = "GENERAL_CHAT"

    return {
        "request_type": request_type
    }


def route_after_router(
    state: TextToSqlState,
) -> Literal["understand_query", "reject_operation", "clarify_question", "general_answer"]:
    request_type = state["request_type"]

    if request_type == "DATA_QUERY":
        return "understand_query"
    if request_type == "DATA_OPERATION":
        return "reject_operation"
    if request_type == "AMBIGUOUS":
        return "clarify_question"
    return "general_answer"


def understand_query_node(state: TextToSqlState) -> TextToSqlState:
    question = state["question"]

    intent = {
        "target": "订单",
        "metric": "订单数量" if "多少" in question or "统计" in question else "订单明细",
        "time_range": "最近 7 天" if "最近 7 天" in question else "未指定",
        "condition": "未支付" if "未支付" in question else "无",
    }

    return {
        "intent": intent
    }


def retrieve_schema_node(state: TextToSqlState) -> TextToSqlState:
    # 真实项目里，这一步可能会从 Schema 文档、向量库或元数据表里检索。
    # 这里直接写死几条 Schema，方便课堂演示。
    return {
        "schemas": [
            "order_payment(order_no, status, order_amount, created_at)",
            "status: INIT 表示未支付初始化，PROCESSING 表示支付处理中，SUCCESS 表示支付成功",
            "created_at: 订单创建时间",
        ]
    }


def build_query_plan_node(state: TextToSqlState) -> TextToSqlState:
    intent = state["intent"]

    query_plan = {
        "table": "order_payment",
        "select": "COUNT(*) AS order_count",
        "where_status": "status IN ('INIT', 'PROCESSING')"
        if intent["condition"] == "未支付"
        else "1 = 1",
        "where_time": "created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
        if intent["time_range"] == "最近 7 天"
        else "1 = 1",
    }

    return {
        "query_plan": query_plan
    }


def generate_sql_node(state: TextToSqlState) -> TextToSqlState:
    plan = state["query_plan"]

    sql = (
        f"SELECT {plan['select']} "
        f"FROM {plan['table']} "
        f"WHERE {plan['where_status']} "
        f"AND {plan['where_time']} "
        "LIMIT 100"
    )

    return {
        "sql": sql
    }


def sql_guard_node(state: TextToSqlState) -> TextToSqlState:
    sql = state["sql"].lower()
    dangerous_words = ["insert", "update", "delete", "drop", "truncate", "alter"]

    safe = sql.strip().startswith("select") and not any(word in sql for word in dangerous_words)

    return {
        "safe": safe
    }


def route_after_guard(state: TextToSqlState) -> Literal["execute_sql", "reject_sql"]:
    if state["safe"]:
        return "execute_sql"
    return "reject_sql"


def execute_sql_node(state: TextToSqlState) -> TextToSqlState:
    # 这里不连数据库，只模拟数据库返回结果。
    return {
        "rows": [
            {
                "order_count": 18
            }
        ]
    }


def answer_node(state: TextToSqlState) -> TextToSqlState:
    order_count = state["rows"][0]["order_count"]

    return {
        "answer": f"最近 7 天未支付订单共有 {order_count} 笔。"
    }


def reject_operation_node(state: TextToSqlState) -> TextToSqlState:
    return {
        "answer": "这个问题涉及修改或删除数据，Text-to-SQL 不能直接执行这类操作。"
    }


def clarify_question_node(state: TextToSqlState) -> TextToSqlState:
    return {
        "answer": "你想看订单数量、订单金额，还是订单明细？可以把查询目标说得再具体一点。"
    }


def general_answer_node(state: TextToSqlState) -> TextToSqlState:
    return {
        "answer": "这个问题不是数据查询，可以走普通问答流程。"
    }


def reject_sql_node(state: TextToSqlState) -> TextToSqlState:
    return {
        "answer": "生成的 SQL 没有通过安全校验，系统拒绝执行。"
    }


def build_graph():
    graph_builder = StateGraph(TextToSqlState)

    graph_builder.add_node("router", router_node)
    graph_builder.add_node("understand_query", understand_query_node)
    graph_builder.add_node("retrieve_schema", retrieve_schema_node)
    graph_builder.add_node("build_query_plan", build_query_plan_node)
    graph_builder.add_node("generate_sql", generate_sql_node)
    graph_builder.add_node("sql_guard", sql_guard_node)
    graph_builder.add_node("execute_sql", execute_sql_node)
    graph_builder.add_node("answer", answer_node)
    graph_builder.add_node("reject_operation", reject_operation_node)
    graph_builder.add_node("clarify_question", clarify_question_node)
    graph_builder.add_node("general_answer", general_answer_node)
    graph_builder.add_node("reject_sql", reject_sql_node)

    graph_builder.add_edge(START, "router")
    graph_builder.add_conditional_edges(
        "router",
        route_after_router,
        {
            "understand_query": "understand_query",
            "reject_operation": "reject_operation",
            "clarify_question": "clarify_question",
            "general_answer": "general_answer",
        },
    )

    graph_builder.add_edge("understand_query", "retrieve_schema")
    graph_builder.add_edge("retrieve_schema", "build_query_plan")
    graph_builder.add_edge("build_query_plan", "generate_sql")
    graph_builder.add_edge("generate_sql", "sql_guard")
    graph_builder.add_conditional_edges(
        "sql_guard",
        route_after_guard,
        {
            "execute_sql": "execute_sql",
            "reject_sql": "reject_sql",
        },
    )
    graph_builder.add_edge("execute_sql", "answer")

    graph_builder.add_edge("answer", END)
    graph_builder.add_edge("reject_operation", END)
    graph_builder.add_edge("clarify_question", END)
    graph_builder.add_edge("general_answer", END)
    graph_builder.add_edge("reject_sql", END)

    return graph_builder.compile()


def main():
    graph = build_graph()

    questions = [
        "查询最近 7 天未支付订单有多少？",
        "把昨天订单都改成成功",
        "看一下订单",
        "退款为什么失败？",
    ]

    for question in questions:
        result = graph.invoke({
            "question": question
        })

        print("=" * 70)
        print(f"用户问题：{question}")
        print(f"请求类型：{result['request_type']}")
        if "sql" in result:
            print(f"生成 SQL：{result['sql']}")
            print(f"SQL 是否安全：{result['safe']}")
        print(f"最终回答：{result['answer']}")


if __name__ == "__main__":
    main()
