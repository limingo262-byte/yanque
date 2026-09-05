---
title: "YanQue Text-to-SQL Agent Resource Index"
type: text-to-sql-agent-index
resourceUri: "bear://yanque/text-to-sql/agent"
---

# YanQue Text-to-SQL Agent Resource Index

本目录描述 YanQue Text-to-SQL 的完整 MCP 能力地图。流程方法论由 `yanque-text-to-sql` Skill 提供，本次任务参数和输出格式由 `yanque_text_to_sql` Prompt 提供。

## 入口资产

| 资产 | 位置 | 用途 |
|---|---|---|
| Skill | `yanque-text-to-sql` | 判断何时使用以及如何执行 |
| Prompt | `yanque_text_to_sql` | 传入问题、数据源和执行开关 |
| 数据源说明 | `bear://yanque/text-to-sql/agent/datasource` | 选择数据源和理解执行边界 |
| 安全规则 | `bear://yanque/text-to-sql/agent/security` | SQL 和敏感字段约束 |
| 评测说明 | `bear://yanque/text-to-sql/agent/evaluation` | 评测样本、断言和评分依据 |

## 业务域 Resource

每个业务域有一份 Business Resource 和一份 Metrics Resource：

```text
bear://yanque/text-to-sql/business/{order|student|teaching|learning|homework|exam|ai}
bear://yanque/text-to-sql/metrics/{order|student|teaching|learning|homework|exam|ai}
```

## Schema Resource

```text
bear://yanque/text-to-sql/schema/{tableName}
```

生成 SQL 前，SQL 中出现的每张表都必须读取对应 Schema Resource。总目录是：

```text
bear://yanque/text-to-sql/schema
```

## 推荐调用顺序

```text
识别业务域 -> 读取 Business -> 必要时读取 Metrics
           -> 读取每张表 Schema -> 生成 SELECT
           -> query_data_source（仅在允许执行时）
```
