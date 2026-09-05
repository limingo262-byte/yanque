# Text-to-SQL Codex 通过 MCP 个人数据库成功测试记录

## 测试结论

本次测试已将 Text-to-SQL 使用的数据源从老师数据库切换为个人业务数据库。

在 Codex 中直接输入业务自然语言问题后，Codex 成功连接 Bear MCP，并完成：

```text
Codex 对话
 -> yanque-text-to-sql Skill
 -> yanque_text_to_sql Prompt
 -> Business / Metrics / Schema Resource
 -> 生成只读 SELECT SQL
 -> query_data_source
 -> 个人业务数据库
 -> 返回查询结果和自然语言答案
```

测试结果：成功。

## 验证内容

| 验证项 | 结果 |
|---|---|
| Codex 连接 Bear MCP | 成功 |
| MCP Token 鉴权 | 成功 |
| Text-to-SQL Skill 触发 | 成功 |
| Text-to-SQL Prompt 使用 | 成功 |
| 业务/指标/表结构 Resource 读取 | 成功 |
| 个人数据库数据源访问 | 成功 |
| 只读 SQL 生成 | 成功 |
| `query_data_source` Tool 调用 | 成功 |
| Codex 返回答案 | 成功 |

## 真实验收参数

当前 Bear MCP 的数据源 Tool schema 使用驼峰参数名，实际调用如下：

```json
{
  "name": "query_data_source",
  "arguments": {
    "datasourceId": 1,
    "sql": "SELECT COUNT(s.id) AS student_total FROM student s"
  }
}
```

返回结果为 `student_total = 3`。表结构 Resource 当前实际 URI 为 `bear://yanque/text-to-sql/ddl/student`；它与规划文档中的 `schema/{tableName}` 是命名差异，验收时以 `resources/list` 返回值为准。

## 安全负向验收

| 场景 | 结果 |
|---|---|
| `UPDATE student ...` | 被拒绝：只允许执行 SELECT 查询 |
| `SELECT * FROM student` | 被拒绝：禁止使用 SELECT * |
| `SELECT COUNT(*) AS student_total FROM student` | 成功，返回 3 |

本次同步同时将 `student` 表 Resource 更新为个人数据库真实字段，标记 `password`、手机号等敏感字段不可查询。

## 关键结论

1. 当前 Text-to-SQL 对话已经不依赖老师的数据库。
2. Codex 可以通过 Bear MCP 直接完成自然语言到 SQL 再到答案的闭环。
3. 数据库密码等敏感配置未写入本文档。
4. MCP 权限仍然遵循角色权限与 Token 选择的交集。
5. 本记录证明的是 Codex → Bear MCP → 个人数据库的成功链路；YanQue Admin 的分析和评测页面属于独立管理链路。

## 演示时的简短说法

“我已经把数据源切换成自己的数据库。现在在 Codex 中直接提问，Codex 会通过 Bear MCP 加载 Text-to-SQL Skill，读取业务口径和表结构 Resource，生成只读 SQL，再调用 `query_data_source` 查询我的数据库，最后返回结果和自然语言答案，整条 MCP 对话链路已经测试成功。”

## 2026-09-05 最新回归结果

本次在 `http://localhost:5174/textToSqlAnalysis` 重新验证个人数据库：

| 验证场景 | 结果 |
|---|---|
| 按班级统计学生人数 | 成功，运行记录 `#29`，返回 2 行，生成柱状图 |
| 按支付状态统计订单数量和净支付金额 | 成功，先澄清时间范围，再执行运行记录 `#30` |
| Text-to-SQL 评测任务“本地个人数据库 Text-to-SQL 修复后回归” | 成功，3/3 通过，100% |
| Bear MCP Resource 权限同步 | 成功，Token 1 可见 25 个 YanQue Text-to-SQL Resource |
| Skill、Prompt、正常查询和安全负向用例 | 全部通过 |

说明：订单测试使用“最近 30 天”时，当前个人库按 `pay_success_time` 返回 0 行，这是数据时间范围结果；SQL 生成、校验、权限检查、执行和空结果分析均正常。
