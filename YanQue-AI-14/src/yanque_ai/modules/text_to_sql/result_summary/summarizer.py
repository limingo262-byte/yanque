"""Text-to-SQL 查询结果总结器。"""

from __future__ import annotations

import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from ....common.config import Settings
from ....integrations.java import JavaPromptClient
from ....integrations.java.text_to_sql_client import SqlExecutionResult
from ....prompts.codes import TEXT_TO_SQL_RESULT_SUMMARY_SYSTEM
from .schemas import ResultChartData, ResultSummary


MAX_ROWS_FOR_SUMMARY = 200


class ResultSummarizer:
    """调用大模型，把 SQL rows 总结成结论和前端图表数据。"""

    def __init__(
        self,
        model: ChatOpenAI,
        settings: Settings,
        prompt_client: JavaPromptClient | None = None,
    ) -> None:
        self._mode = settings.text_to_sql_result_summary_mode
        self._chain = None
        if self._mode == "llm":
            self._prompt_client = prompt_client or JavaPromptClient(settings)
            prompt_code = settings.text_to_sql_result_summary_prompt_code or TEXT_TO_SQL_RESULT_SUMMARY_SYSTEM
            system_prompt = self._prompt_client.get_active_prompt_content(prompt_code)
            safe_system_prompt = _escape_prompt_template_text(system_prompt)
            self._chain = (
                ChatPromptTemplate.from_messages(
                    [
                        ("system", safe_system_prompt),
                        (
                            "human",
                            "\n".join(
                                [
                                    "用户问题：{question}",
                                    "",
                                    "执行 SQL：",
                                    "{sql}",
                                    "",
                                    "返回行数：{row_count}",
                                    "",
                                    "查询结果 rows JSON：",
                                    "{rows_json}",
                                    "",
                                    "指标口径上下文：",
                                    "{metric_context}",
                                    "",
                                    "业务说明上下文：",
                                    "{business_context}",
                                    "",
                                    "Java 查询中心执行细节 JSON：",
                                    "{execution_detail_json}",
                                ]
                            ),
                        ),
                    ]
                )
                | model.with_structured_output(ResultSummary)
            )

    def summarize(
        self,
        *,
        question: str,
        sql: str | None,
        rows: list[dict[str, object]],
        sql_execution_result: SqlExecutionResult | None = None,
        metric_context: str = "",
        business_context: str = "",
    ) -> ResultSummary:
        """调用模型分析结果。

        rows 可能很多，发给模型前只截取前 200 行，避免结果集过大拖慢总结节点。
        原始 rows 仍然会在 TextToSqlResponse.rows 返回给前端。
        """

        if self._mode != "llm":
            return build_deterministic_result_summary(question=question, sql=sql, rows=rows)

        row_count = len(rows)
        result = self._chain.invoke(
            {
                "question": question,
                "sql": sql or "",
                "row_count": row_count,
                "rows_json": json.dumps(rows[:MAX_ROWS_FOR_SUMMARY], ensure_ascii=False, default=str),
                "metric_context": metric_context,
                "business_context": business_context,
                "execution_detail_json": json.dumps(
                    _execution_detail(sql_execution_result),
                    ensure_ascii=False,
                    default=str,
                ),
            }
        )
        if not isinstance(result, ResultSummary):
            raise TypeError("结果总结模型没有返回 ResultSummary")
        return result


def build_deterministic_result_summary(
    *,
    question: str,
    sql: str | None,
    rows: list[dict[str, object]],
) -> ResultSummary:
    """在不调用模型的情况下生成基础结论和图表数据。

    SQL 已经由 Java 查询中心完成安全校验、权限校验和执行；这里仅整理已返回的 rows。
    这样常规查询不会因为最后一次模型润色而额外等待几十秒。
    """

    row_count = len(rows)
    columns = _columns(rows)
    numeric_fields = [field for field in columns if _has_numeric_value(rows, field)]
    dimension_field = next((field for field in columns if field not in numeric_fields), None)

    if not rows:
        chart_type = "table"
        chart_data = ResultChartData(chart_type=chart_type, rows=[])
        conclusion = "查询完成，但没有匹配到数据。"
        data_description = "结果集为空。"
        key_findings = ["返回 0 行数据。"]
        chart_reason = "没有数据可供绘图，保留空结果状态。"
    elif row_count == 1 and numeric_fields:
        chart_type = "stat"
        chart_data = ResultChartData(
            chart_type=chart_type,
            y_fields=numeric_fields,
            rows=rows[:MAX_ROWS_FOR_SUMMARY],
        )
        conclusion = "查询完成：" + "，".join(
            f"{field} 为 {_format_value(rows[0].get(field))}" for field in numeric_fields
        ) + "。"
        data_description = f"返回 1 行聚合结果，包含 {len(numeric_fields)} 个数值指标。"
        key_findings = [f"{field}：{_format_value(rows[0].get(field))}" for field in numeric_fields]
        chart_reason = "单行数值结果适合用指标卡展示。"
    elif dimension_field and numeric_fields:
        chart_type = "bar"
        chart_rows = rows[:MAX_ROWS_FOR_SUMMARY]
        categories = [_format_value(row.get(dimension_field)) for row in chart_rows]
        series = [
            {
                "name": field,
                "type": "bar",
                "data": [_number_or_value(row.get(field)) for row in chart_rows],
            }
            for field in numeric_fields
        ]
        chart_data = ResultChartData(
            chart_type=chart_type,
            x_field=dimension_field,
            y_fields=numeric_fields,
            categories=categories,
            series=series,
            rows=chart_rows,
        )
        conclusion = f"查询完成，共返回 {row_count} 行结果，按 {dimension_field} 展示 {', '.join(numeric_fields)}。"
        data_description = f"结果按 {dimension_field} 分组，共 {row_count} 个分组。"
        key_findings = [f"返回 {row_count} 行数据。", f"分组字段：{dimension_field}。"]
        chart_reason = "结果包含分组字段和数值指标，适合用柱状图比较。"
    else:
        chart_type = "table"
        chart_data = ResultChartData(
            chart_type=chart_type,
            y_fields=numeric_fields,
            rows=rows[:MAX_ROWS_FOR_SUMMARY],
        )
        conclusion = f"查询完成，共返回 {row_count} 行结果。"
        data_description = f"结果包含 {len(columns)} 个字段，适合查看明细表。"
        key_findings = [f"返回 {row_count} 行数据。"]
        chart_reason = "当前结果缺少明确的分组和数值关系，保留明细表展示。"

    title = question.strip()[:80] or "查询结果"
    echarts_option: dict[str, object] = {}
    if chart_type == "bar":
        echarts_option = {
            "tooltip": {"trigger": "axis"},
            "legend": {},
            "xAxis": {"type": "category", "data": chart_data.categories},
            "yAxis": {"type": "value"},
            "series": chart_data.series,
        }

    return ResultSummary(
        conclusion=conclusion,
        data_description=data_description,
        key_findings=key_findings,
        cautions=["结论基于本次查询返回的数据行，详细口径请结合 SQL 和查询依据查看。"],
        chart_type=chart_type,
        chart_title=title,
        chart_reason=chart_reason,
        chart_data=chart_data,
        echarts_option=echarts_option,
        basis=[f"执行 SQL：{sql or '未提供'}", f"结果行数：{row_count}"],
        sql=sql,
        row_count=row_count,
    )


def _columns(rows: list[dict[str, object]]) -> list[str]:
    columns: list[str] = []
    for row in rows:
        for field in row:
            if field not in columns:
                columns.append(field)
    return columns


def _has_numeric_value(rows: list[dict[str, object]], field: str) -> bool:
    return any(isinstance(row.get(field), (int, float)) and not isinstance(row.get(field), bool) for row in rows)


def _number_or_value(value: object) -> object:
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) else _format_value(value)


def _format_value(value: object) -> str:
    if value is None:
        return "-"
    if isinstance(value, float):
        return f"{value:g}"
    return str(value)


def _execution_detail(result: SqlExecutionResult | None) -> dict[str, object]:
    if result is None:
        return {}
    return {
        "success": result.success,
        "message": result.message,
        "row_count": result.row_count,
        "validation": result.validation,
        "permission": result.permission,
        "explain": result.explain,
    }


def _escape_prompt_template_text(text: str) -> str:
    """平台提示词是普通文本，里面的 JSON 大括号不能被 LangChain 当成变量。"""

    return text.replace("{", "{{").replace("}", "}}")
