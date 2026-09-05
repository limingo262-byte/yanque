"""通过 Bear MCP Tool 发布 YanQue Text-to-SQL 的业务、指标和 Schema Resource。"""

import asyncio
import json
from pathlib import Path

from mcp.client.session import ClientSession
from mcp.client.streamable_http import streamablehttp_client


ROOT = Path(__file__).resolve().parents[3]
MCP_URL = "http://127.0.0.1:8091/mcp"
HEADERS = {"Authorization": "Bearer mcp_dev_token"}


def schema(table_name: str, description: str, columns: list[dict], relationships: list[dict] | None = None) -> str:
    return json.dumps(
        {
            "table_name": table_name,
            "description": description,
            "primary_key": "id",
            "columns": columns,
            "relationships": relationships or [],
            "query_rules": [
                "只允许查询公开业务字段。",
                "禁止 SELECT *、写操作、DDL 和多语句。",
                "明细查询必须带 LIMIT。",
            ],
        },
        ensure_ascii=False,
    )


def resources() -> list[dict]:
    business_dir = ROOT / "bear-mcp-single" / "bear-mcp-single" / "docs" / "text-to-sql-resources" / "yanque-business-terms"
    metrics_dir = ROOT / "bear-mcp-single" / "bear-mcp-single" / "docs" / "text-to-sql-resources" / "yanque-metrics"
    items: list[dict] = []

    for domain in ("teaching", "learning", "homework", "exam", "ai"):
        items.extend(
            [
                {
                    "resource_uri": f"bear://yanque/text-to-sql/business/{domain}",
                    "name": f"YanQue {domain} business rules",
                    "description": f"YanQue {domain} business terminology and query rules",
                    "markdown_content": (business_dir / f"{domain}.md").read_text(encoding="utf-8"),
                },
                {
                    "resource_uri": f"bear://yanque/text-to-sql/metrics/{domain}",
                    "name": f"YanQue {domain} metrics",
                    "description": f"YanQue {domain} metric definitions",
                    "markdown_content": (metrics_dir / f"{domain}.md").read_text(encoding="utf-8"),
                },
            ]
        )

    items.extend(
        [
            {
                "resource_uri": "bear://yanque/text-to-sql/business/order",
                "name": "YanQue order business rules",
                "description": "Personal yanque demo order query rules",
                "markdown_content": """# 订单业务规则\n\n当前个人演示库使用 `order_payment`。\n\n- 订单金额字段：`order_amount`。\n- 已退款金额字段：`refunded_amount`。\n- 支付成功时间字段：`pay_success_time`。\n- 当前演示数据的支付成功状态为 `PAID`。\n- 订单净收入可按 `order_amount - refunded_amount` 计算。\n- 没有时间范围的趋势或统计问题，先澄清时间范围。\n""",
            },
            {
                "resource_uri": "bear://yanque/text-to-sql/metrics/order",
                "name": "YanQue order metrics",
                "description": "Personal yanque demo order metric definitions",
                "markdown_content": """# 订单指标口径\n\n- 订单数量：`COUNT(order_payment.id)`；若题目要求支付成功，增加 `status = 'PAID'`。\n- 支付金额：`SUM(order_payment.order_amount)`；若题目要求净金额，使用 `SUM(order_amount - refunded_amount)`。\n- 支付时间：优先使用 `pay_success_time`。\n- 金额单位：数据库存储单位。\n- 趋势或统计问题必须有明确时间范围。\n""",
            },
            {
                "resource_uri": "bear://yanque/text-to-sql/schema/student",
                "name": "student schema",
                "description": "Personal yanque student table schema",
                "markdown_content": schema(
                    "student",
                    "学生基础档案",
                    [
                        {"name": "id", "type": "BIGINT", "description": "主键"},
                        {"name": "student_no", "type": "VARCHAR(32)", "description": "学号"},
                        {"name": "student_name", "type": "VARCHAR(50)", "description": "学生姓名，输出时需脱敏"},
                        {"name": "gender", "type": "VARCHAR(10)", "description": "性别"},
                        {"name": "education", "type": "VARCHAR(30)", "description": "学历"},
                        {"name": "grade_year", "type": "INT", "description": "年级年份"},
                        {"name": "school", "type": "VARCHAR(100)", "description": "学校"},
                        {"name": "major", "type": "VARCHAR(100)", "description": "专业"},
                        {"name": "teaching_mode", "type": "VARCHAR(20)", "description": "授课方式"},
                        {"name": "class_id", "type": "BIGINT", "description": "班级 ID"},
                        {"name": "student_tag", "type": "VARCHAR(50)", "description": "学生标签"},
                        {"name": "status", "type": "VARCHAR(30)", "description": "学生状态"},
                        {"name": "created_at", "type": "DATETIME", "description": "创建时间"},
                    ],
                    [{"table_name": "sys_class", "on": "student.class_id = sys_class.id"}],
                ),
            },
            {
                "resource_uri": "bear://yanque/text-to-sql/schema/sys_class",
                "name": "sys_class schema",
                "description": "Personal yanque class table schema",
                "markdown_content": schema(
                    "sys_class",
                    "班级信息",
                    [
                        {"name": "id", "type": "BIGINT", "description": "主键"},
                        {"name": "class_period", "type": "VARCHAR(64)", "description": "班级期数"},
                        {"name": "head_teacher_id", "type": "BIGINT", "description": "班主任 ID"},
                        {"name": "campus_id", "type": "BIGINT", "description": "校区 ID"},
                        {"name": "course_id", "type": "BIGINT", "description": "课程 ID"},
                        {"name": "created_at", "type": "DATETIME", "description": "创建时间"},
                    ],
                    [{"table_name": "student", "on": "student.class_id = sys_class.id"}],
                ),
            },
            {
                "resource_uri": "bear://yanque/text-to-sql/schema/order_payment",
                "name": "order_payment schema",
                "description": "Personal yanque payment order table schema",
                "markdown_content": schema(
                    "order_payment",
                    "支付订单流水",
                    [
                        {"name": "id", "type": "BIGINT", "description": "主键"},
                        {"name": "order_no", "type": "VARCHAR(64)", "description": "订单号"},
                        {"name": "student_phone", "type": "VARCHAR(30)", "description": "学生手机号，禁止直接输出"},
                        {"name": "student_name", "type": "VARCHAR(50)", "description": "学生姓名，禁止直接输出"},
                        {"name": "product_id", "type": "VARCHAR(64)", "description": "产品 ID"},
                        {"name": "order_amount", "type": "DECIMAL(10,2)", "description": "订单金额"},
                        {"name": "refunded_amount", "type": "DECIMAL(10,2)", "description": "已退款金额"},
                        {"name": "status", "type": "VARCHAR(30)", "description": "订单状态，演示数据支付成功为 PAID"},
                        {"name": "pay_success_time", "type": "DATETIME", "description": "支付成功时间"},
                        {"name": "created_at", "type": "DATETIME", "description": "创建时间"},
                    ],
                ),
            },
            {
                "resource_uri": "bear://yanque/text-to-sql/ddl/student",
                "name": "student DDL compatibility resource",
                "description": "Compatibility alias for the personal yanque student schema",
                "markdown_content": schema(
                    "student",
                    "学生基础档案",
                    [
                        {"name": "id", "type": "BIGINT", "description": "主键"},
                        {"name": "student_no", "type": "VARCHAR(32)", "description": "学号"},
                        {"name": "student_name", "type": "VARCHAR(50)", "description": "学生姓名，输出时需脱敏"},
                        {"name": "class_id", "type": "BIGINT", "description": "班级 ID"},
                        {"name": "status", "type": "VARCHAR(30)", "description": "学生状态"},
                    ],
                    [{"table_name": "sys_class", "on": "student.class_id = sys_class.id"}],
                ),
            },
            {
                "resource_uri": "bear://yanque/text-to-sql/ddl/sys_class",
                "name": "sys_class DDL compatibility resource",
                "description": "Compatibility alias for the personal yanque class schema",
                "markdown_content": schema(
                    "sys_class",
                    "班级信息",
                    [
                        {"name": "id", "type": "BIGINT", "description": "主键"},
                        {"name": "class_period", "type": "VARCHAR(64)", "description": "班级期数"},
                        {"name": "head_teacher_id", "type": "BIGINT", "description": "班主任 ID"},
                        {"name": "campus_id", "type": "BIGINT", "description": "校区 ID"},
                        {"name": "course_id", "type": "BIGINT", "description": "课程 ID"},
                    ],
                    [{"table_name": "student", "on": "student.class_id = sys_class.id"}],
                ),
            },
            {
                "resource_uri": "bear://yanque/text-to-sql/ddl/order_payment",
                "name": "order_payment DDL compatibility resource",
                "description": "Compatibility alias for the personal yanque payment schema",
                "markdown_content": schema(
                    "order_payment",
                    "支付订单流水",
                    [
                        {"name": "id", "type": "BIGINT", "description": "主键"},
                        {"name": "order_no", "type": "VARCHAR(64)", "description": "订单号"},
                        {"name": "order_amount", "type": "DECIMAL(10,2)", "description": "订单金额"},
                        {"name": "refunded_amount", "type": "DECIMAL(10,2)", "description": "已退款金额"},
                        {"name": "status", "type": "VARCHAR(30)", "description": "订单状态，支付成功为 PAID"},
                        {"name": "pay_success_time", "type": "DATETIME", "description": "支付成功时间"},
                    ],
                ),
            },
            {
                "resource_uri": "bear://yanque/text-to-sql/table-catalog",
                "name": "YanQue personal table catalog",
                "description": "Tables actually available in the personal yanque demo database",
                "markdown_content": """# YanQue 个人库表目录\n\n| 表名 | 业务域 | 说明 |\n| --- | --- | --- |\n| `order_payment` | order | 支付订单流水 |\n| `student` | student | 学生基础档案 |\n| `sys_class` | teaching | 班级信息 |\n\n当前个人演示数据库只发布以上三张可查询业务表。\n""",
            },
        ]
    )
    return items


async def main() -> None:
    async with streamablehttp_client(MCP_URL, headers=HEADERS) as (read_stream, write_stream, _):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            for item in resources():
                result = await session.call_tool(
                    "create_resource",
                    arguments={**item, "publish_status": 2, "overwrite": True},
                )
                payload = result.model_dump(mode="json") if hasattr(result, "model_dump") else result
                print(item["resource_uri"], json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
