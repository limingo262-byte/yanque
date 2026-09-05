/* Migrate Feishu wrappers to dynamic tools after FeishuScriptFacade is deployed. */
INSERT INTO mcp_dynamic_tool
    (tool_name, tool_description, input_schema, groovy_script,
     linked_request_keys, linked_data_source_ids, is_enabled, publish_status)
VALUES
('feishu_mcp_list_tools', '列出飞书官方远程 MCP 当前可用工具。',
 '{"type":"object","properties":{"allowed_tools":{"type":"string"}}}',
 'return feishu.listTools(params.allowed_tools as String)', '[]', '[]', 1, 1),
('feishu_mcp_call_tool', '通用飞书远程 MCP 代理调用工具。',
 '{"type":"object","properties":{"tool_name":{"type":"string"},"arguments":{"type":"object"}},"required":["tool_name"]}',
 'return feishu.callTool(params.tool_name as String, (params.arguments ?: [:]) as Map)', '[]', '[]', 1, 1),
('feishu_mcp_fetch_doc', '通过飞书官方远程 MCP 读取云文档完整内容。',
 '{"type":"object","properties":{"doc_id":{"type":"string"},"doc_url":{"type":"string"}}}',
 'return feishu.fetchDoc(params.doc_id as String, params.doc_url as String)', '[]', '[]', 1, 1),
('feishu_mcp_search_doc', '通过飞书官方远程 MCP 搜索云文档。',
 '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}',
 'return feishu.searchDoc(params.keyword as String)', '[]', '[]', 1, 1),
('feishu_mcp_create_doc', '通过飞书官方远程 MCP 创建云文档。',
 '{"type":"object","properties":{"title":{"type":"string"},"markdown":{"type":"string"}},"required":["title"]}',
 'return feishu.createDoc(params.title as String, params.markdown as String)', '[]', '[]', 1, 1),
('feishu_mcp_add_comment', '通过飞书官方远程 MCP 给云文档添加全文评论。',
 '{"type":"object","properties":{"doc_id":{"type":"string"},"doc_url":{"type":"string"},"comment":{"type":"string"}},"required":["comment"]}',
 'return feishu.addComment(params.doc_id as String, params.doc_url as String, params.comment as String)', '[]', '[]', 1, 1)
ON DUPLICATE KEY UPDATE
 tool_description=VALUES(tool_description), input_schema=VALUES(input_schema),
 groovy_script=VALUES(groovy_script), linked_request_keys=VALUES(linked_request_keys),
 linked_data_source_ids=VALUES(linked_data_source_ids), is_enabled=VALUES(is_enabled),
 publish_status=VALUES(publish_status);
