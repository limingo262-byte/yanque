-- 为 Bear MCP 开启实时 YanQue SLS 日志查询内置 Tool。
-- Tool 通过 Bear -> yanque-admin 容器网络调用内部日志接口，
-- 不把阿里云 AccessKey 放入 MCP 数据库或 Tool 参数。

INSERT IGNORE INTO mcp_role_tool (role_code, tool_name)
VALUES ('ADMIN', 'query_yanque_sls_logs');

INSERT INTO mcp_user_tool_selection (token_id, tool_name, tool_type, is_enabled)
SELECT id, 'query_yanque_sls_logs', 'BUILTIN', 1
FROM mcp_user_token t
WHERE NOT EXISTS (
    SELECT 1
    FROM mcp_user_tool_selection s
    WHERE s.token_id = t.id
      AND s.tool_name = 'query_yanque_sls_logs'
)
ON DUPLICATE KEY UPDATE
    tool_type = VALUES(tool_type),
    is_enabled = VALUES(is_enabled);
