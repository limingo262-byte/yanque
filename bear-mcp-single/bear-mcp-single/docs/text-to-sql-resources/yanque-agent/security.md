---
title: "YanQue Text-to-SQL Security Rules"
type: text-to-sql-security
resourceUri: "bear://yanque/text-to-sql/agent/security"
---

# YanQue Text-to-SQL 安全规则

## SQL 规则

- 只允许一条只读 `SELECT`。
- 禁止写操作、DDL、授权语句、存储过程和多语句。
- 禁止分号和 `SELECT *`。
- 必须显式列出字段，明细查询必须有 `LIMIT`。
- 表、字段和 Join 字段必须来自已经读取的 Schema Resource。

## 数据权限

MCP 能力权限和 YanQue 业务数据权限是两道独立边界：

```text
MCP 有权调用 query_data_source
    !=
用户可以查询任意表和任意字段
```

MCP 负责 Token、角色、Tool/Resource 的可见性和调用校验；YanQue Admin 的业务权限负责角色可查询的表字段范围。任何一层拒绝，都不能执行查询。

## 敏感数据

手机号、密码、令牌、身份证号等敏感字段不作为默认展示字段。用户明确提出敏感数据需求时，应先确认业务必要性和授权范围，不能因为字段存在于 Schema Resource 中就自动返回。

## 无权限时的行为

- `tools/list` 不返回未授权 Tool。
- `resources/list` 不返回未授权 Resource。
- 直接调用未授权 Tool 时返回权限错误并写入审计日志。
- 直接读取未授权 Resource 时返回 Resource 不存在、未发布或无权限读取。
- SQL 校验或业务字段权限失败时，不访问数据库。
