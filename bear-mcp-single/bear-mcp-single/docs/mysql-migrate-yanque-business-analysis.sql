-- YanQue 第 22 天业务问题深度分析 MCP 链路迁移。
-- 目标：日志 + 源码 + 数据库只读核验 + 业务排障知识检索。

INSERT INTO mcp_skill (
    skill_code, name, description, category, object_key, file_name, file_size,
    creator_id, is_enabled, publish_status
) VALUES (
    'SKILL0000000021',
    'yanque-admin-log-analysis',
    '分析 YanQue 线上日志、源码、数据库状态和业务排障知识，定位技术异常或业务状态不一致原因。',
    '业务排障',
    'local://bear-skill/yanque-admin-log-analysis/SKILL.md',
    'SKILL.md',
    NULL,
    NULL,
    1,
    2
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    category = VALUES(category),
    object_key = VALUES(object_key),
    file_name = VALUES(file_name),
    creator_id = VALUES(creator_id),
    is_enabled = 1,
    publish_status = 2;

UPDATE mcp_skill
SET creator_id = NULL,
    is_enabled = 1,
    publish_status = 2
WHERE skill_code = 'SKILL0000000021';

-- 这些是 Day22 链路需要的内置工具。
INSERT IGNORE INTO mcp_role_tool (role_code, tool_name)
VALUES
    ('ADMIN', 'get_skill'),
    ('ADMIN', 'query_yanque_sls_logs'),
    ('ADMIN', 'run_repository_command'),
    ('ADMIN', 'list_data_sources'),
    ('ADMIN', 'query_data_source'),
    ('ADMIN', 'search_yanque_troubleshooting_knowledge');

-- 给所有现有 token 默认开启 Day22 链路工具，避免客户端连上 MCP 后 tools/list 看不到。
INSERT INTO mcp_user_tool_selection (token_id, tool_name, tool_type, is_enabled)
SELECT t.id, x.tool_name, 'BUILTIN', 1
FROM mcp_user_token t
JOIN (
    SELECT 'get_skill' AS tool_name
    UNION ALL SELECT 'query_yanque_sls_logs'
    UNION ALL SELECT 'run_repository_command'
    UNION ALL SELECT 'list_data_sources'
    UNION ALL SELECT 'query_data_source'
    UNION ALL SELECT 'search_yanque_troubleshooting_knowledge'
) x
WHERE NOT EXISTS (
    SELECT 1
    FROM mcp_user_tool_selection s
    WHERE s.token_id = t.id
      AND s.tool_name = x.tool_name
)
ON DUPLICATE KEY UPDATE
    tool_type = VALUES(tool_type),
    is_enabled = VALUES(is_enabled);
