from __future__ import annotations

import unittest

from yanque_ai.modules.text_to_sql.result_summary import build_deterministic_result_summary


class DeterministicResultSummaryTest(unittest.TestCase):
    def test_single_metric_uses_stat_chart(self) -> None:
        result = build_deterministic_result_summary(
            question="学生总数是多少",
            sql="select count(*) as student_total from student",
            rows=[{"student_total": 3}],
        )

        self.assertEqual(result.chart_type, "stat")
        self.assertEqual(result.chart_data.y_fields, ["student_total"])
        self.assertIn("student_total 为 3", result.conclusion)
        self.assertEqual(result.row_count, 1)

    def test_grouped_metrics_use_bar_chart(self) -> None:
        result = build_deterministic_result_summary(
            question="每个班级有多少学生",
            sql="select class_name, count(*) as student_count from student group by class_name",
            rows=[
                {"class_name": "一班", "student_count": 12},
                {"class_name": "二班", "student_count": 9},
            ],
        )

        self.assertEqual(result.chart_type, "bar")
        self.assertEqual(result.chart_data.x_field, "class_name")
        self.assertEqual(result.chart_data.categories, ["一班", "二班"])
        self.assertEqual(result.echarts_option["xAxis"]["data"], ["一班", "二班"])

    def test_empty_result_is_not_an_error(self) -> None:
        result = build_deterministic_result_summary(
            question="查询不存在的学生",
            sql="select * from student where id = 0",
            rows=[],
        )

        self.assertEqual(result.chart_type, "table")
        self.assertEqual(result.conclusion, "查询完成，但没有匹配到数据。")
        self.assertEqual(result.chart_data.rows, [])


if __name__ == "__main__":
    unittest.main()
