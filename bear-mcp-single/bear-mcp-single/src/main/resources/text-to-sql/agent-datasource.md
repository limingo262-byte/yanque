# 数据源说明

当前联调数据源为本机 YanQue 个人业务数据库，MCP 只通过已发布数据源和 `query_data_source` 访问。
客户端应先调用 `list_data_sources`，再使用返回的 datasource_id。
