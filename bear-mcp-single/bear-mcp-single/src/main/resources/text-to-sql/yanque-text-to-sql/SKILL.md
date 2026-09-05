---
name: yanque-text-to-sql
description: 将 YanQue 业务自然语言问题转换为安全只读 SQL，并返回数据分析答案。
---

# YanQue Text-to-SQL

1. 仅处理 YanQue 个人业务数据库的查询问题；写操作、DDL、敏感操作直接拒绝。
2. 先识别业务域，再读取对应 business Resource、metrics Resource、table-catalog 和涉及表的 ddl Resource。
3. 生成一条 SELECT；禁止分号、多语句、SELECT *，表字段必须来自 DDL，明细查询必须带 LIMIT。
4. 先调用 `list_data_sources` 获取 datasource_id，再调用 `query_data_source` 执行 SQL。
5. 返回业务口径、生成 SQL、查询结果和简洁结论；时间范围或指标口径不清时先澄清。
