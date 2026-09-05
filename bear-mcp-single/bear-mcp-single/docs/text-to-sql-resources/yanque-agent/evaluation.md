---
title: "YanQue Text-to-SQL Evaluation Guide"
type: text-to-sql-evaluation-guide
resourceUri: "bear://yanque/text-to-sql/agent/evaluation"
---

# YanQue Text-to-SQL 评测说明

## 评测对象

每条评测样本至少包含：

- 自然语言问题；
- 业务域；
- 期望使用的表和字段；
- 期望 SQL 或等价结果条件；
- 指标、时间和过滤断言；
- 是否允许执行真实查询。

## 建议断言类型

| 断言 | 判断内容 |
|---|---|
| `intent` | 是否进入正确业务域和查询类型 |
| `selected_tables` | 是否选中允许的表 |
| `sql_generation_result` | SQL 是否满足结构和业务规则 |
| `executed_sql` | 实际执行 SQL 是否安全且符合预期 |
| `answer` | 最终回答是否正确解释结果 |
| `semantic` | 自然语言答案是否满足语义要求 |

## 评测流程

```text
读取评测样本
 -> 通过同一 Text-to-SQL 入口运行
 -> 保存 SQL、Resource、执行结果和答案
 -> 执行结构/结果/语义断言
 -> 汇总通过率和失败原因
```

## 失败原因分类

- Resource 缺失或未授权；
- 指标口径错误；
- 表或字段选择错误；
- SQL 非只读或缺少 LIMIT；
- SQL 执行失败；
- 结果正确但自然语言总结错误；
- 需要澄清但模型直接猜测。

评测系统应保留每条失败样本的原问题、使用的 Resource、生成 SQL、执行 SQL、错误信息和最终答案，便于在 Admin 页面定位问题。
