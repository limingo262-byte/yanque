---
title: "YanQue Text-to-SQL Data Source Guide"
type: text-to-sql-datasource-guide
resourceUri: "bear://yanque/text-to-sql/agent/datasource"
---

# YanQue Text-to-SQL 数据源说明

当前运行环境使用项目负责人的个人业务数据库，不再连接老师提供的数据库。数据库凭证只保存在本地或服务端安全配置中，不能写入 Skill、Resource、Prompt、代码仓库或测试截图。

## 运行参数

本次任务由 `yanque_text_to_sql` Prompt 传入：

- `datasource_id`：要查询的数据源 ID。
- `max_rows`：明细查询期望的最大返回行数，默认 100。
- `execute_sql`：是否允许在生成 SQL 后执行。

## 选择和执行规则

1. 不确定个人数据库对应的数据源 ID 时先调用 `list_data_sources`。
2. `execute_sql=false` 时只返回口径和 SQL，不调用查询工具。
3. `execute_sql=true` 时，`datasource_id` 不能为空，且 SQL 必须先满足 Skill 中的安全规则。
4. 调用工具时只提交一条 SQL 和一个数据源 ID。
5. 系统最大返回行数为 500，客户端传入更大值时由服务端截断。

## Tool 入参

```json
{
  "datasource_id": "1",
  "sql": "SELECT order_id, amount FROM order_payment LIMIT 100"
}
```

## 失败处理

- 数据源不存在或未发布：提示用户选择已发布数据源。
- 数据源 ID 缺失：返回已生成 SQL，但不执行。
- 查询超时或连接失败：保留 SQL 和错误信息，不伪造结果。
- 返回行数超过上限：按服务端限制返回，并说明结果已截断。
