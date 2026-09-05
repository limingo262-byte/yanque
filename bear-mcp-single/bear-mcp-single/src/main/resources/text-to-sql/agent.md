# YanQue Text-to-SQL Agent Resource

处理顺序：先识别业务域，再读取业务规则、指标口径、表目录和涉及表的 DDL，最后生成并执行只读 SELECT。
查询动作使用 `query_data_source`，不得直接连接数据库或执行写操作。
