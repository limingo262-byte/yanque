-- YanQue Text-to-SQL MCP 权限绑定模板。
-- 执行前提：mcp_resource 已通过管理端上传并发布；如 token_id 不是 1，请替换下面的 1。
-- 本脚本只补角色和 Token 的能力绑定，不创建或上传 TOS 文件。

INSERT IGNORE INTO mcp_role_tool (role_code, tool_name) VALUES
('ADMIN', 'list_mcp_resources'),
('ADMIN', 'read_mcp_resource'),
('ADMIN', 'list_data_sources'),
('ADMIN', 'query_data_source'),
('ADMIN', 'render_prompt'),
('ADMIN', 'get_skill');

INSERT IGNORE INTO mcp_user_tool_selection (token_id, tool_name, tool_type, is_enabled) VALUES
(1, 'list_mcp_resources', 'BUILTIN', 1),
(1, 'read_mcp_resource', 'BUILTIN', 1),
(1, 'list_data_sources', 'BUILTIN', 1),
(1, 'query_data_source', 'BUILTIN', 1),
(1, 'render_prompt', 'BUILTIN', 1),
(1, 'get_skill', 'BUILTIN', 1);

-- Skill、Prompt 和 Agent 治理 Resource。
INSERT IGNORE INTO mcp_role_resource (role_code, resource_uri) VALUES
('ADMIN', 'bear://yanque/text-to-sql/agent'),
('ADMIN', 'bear://yanque/text-to-sql/agent/datasource'),
('ADMIN', 'bear://yanque/text-to-sql/agent/security'),
('ADMIN', 'bear://yanque/text-to-sql/agent/evaluation');

INSERT IGNORE INTO mcp_user_resource_selection (token_id, resource_uri, is_enabled) VALUES
(1, 'bear://yanque/text-to-sql/agent', 1),
(1, 'bear://yanque/text-to-sql/agent/datasource', 1),
(1, 'bear://yanque/text-to-sql/agent/security', 1),
(1, 'bear://yanque/text-to-sql/agent/evaluation', 1);

-- 7 个业务域的 Business/Metric Resource 权限。
INSERT IGNORE INTO mcp_role_resource (role_code, resource_uri) VALUES
('ADMIN', 'bear://yanque/text-to-sql/business/order'),
('ADMIN', 'bear://yanque/text-to-sql/business/student'),
('ADMIN', 'bear://yanque/text-to-sql/business/teaching'),
('ADMIN', 'bear://yanque/text-to-sql/business/learning'),
('ADMIN', 'bear://yanque/text-to-sql/business/homework'),
('ADMIN', 'bear://yanque/text-to-sql/business/exam'),
('ADMIN', 'bear://yanque/text-to-sql/business/ai'),
('ADMIN', 'bear://yanque/text-to-sql/metrics/order'),
('ADMIN', 'bear://yanque/text-to-sql/metrics/student'),
('ADMIN', 'bear://yanque/text-to-sql/metrics/teaching'),
('ADMIN', 'bear://yanque/text-to-sql/metrics/learning'),
('ADMIN', 'bear://yanque/text-to-sql/metrics/homework'),
('ADMIN', 'bear://yanque/text-to-sql/metrics/exam'),
('ADMIN', 'bear://yanque/text-to-sql/metrics/ai');

INSERT IGNORE INTO mcp_user_resource_selection (token_id, resource_uri, is_enabled)
SELECT 1, resource_uri, 1
FROM mcp_role_resource
WHERE role_code = 'ADMIN'
  AND resource_uri LIKE 'bear://yanque/text-to-sql/%';

-- Schema Resource 数量会随着 Admin 表目录变化，从已发布资源动态绑定，避免写死表名。
INSERT IGNORE INTO mcp_role_resource (role_code, resource_uri)
SELECT 'ADMIN', resource_uri
FROM mcp_resource
WHERE is_enabled = 1
  AND publish_status IN (1, 2)
  AND resource_uri LIKE 'bear://yanque/text-to-sql/schema/%';

INSERT IGNORE INTO mcp_user_resource_selection (token_id, resource_uri, is_enabled)
SELECT 1, resource_uri, 1
FROM mcp_role_resource
WHERE role_code = 'ADMIN'
  AND resource_uri LIKE 'bear://yanque/text-to-sql/schema/%';
