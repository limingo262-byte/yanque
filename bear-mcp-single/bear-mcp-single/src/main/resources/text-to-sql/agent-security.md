# SQL 安全规则

只允许单条只读 SELECT；禁止分号、多语句、INSERT、UPDATE、DELETE、DDL 和 SELECT *。
表名和字段必须来自 DDL Resource，明细查询必须带 LIMIT，权限和安全校验由 MCP/查询中心再次执行。
