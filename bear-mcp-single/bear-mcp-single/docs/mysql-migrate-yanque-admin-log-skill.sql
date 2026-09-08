-- 将 yanque-admin 日志分析 Skill 注册到 Bear MCP。
-- 执行前请先通过 Bear MCP 管理后台上传同名 SKILL.md 到 TOS。
-- 上传后的对象地址必须是 skills/SKILL0000000021/SKILL.md。

INSERT INTO mcp_skill (
    skill_code, name, description, category, object_key, file_name, file_size,
    creator_id, is_enabled, publish_status
) VALUES (
    'SKILL0000000021',
    'yanque-admin-log-analysis',
    '分析 yanque-admin 线上日志，并结合只读源码定位直接原因。',
    '运维排障',
    'skills/SKILL0000000021/SKILL.md',
    'SKILL.md',
    NULL,
    1,
    1,
    1
) ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    category = VALUES(category),
    object_key = VALUES(object_key),
    file_name = VALUES(file_name),
    creator_id = VALUES(creator_id),
    is_enabled = 1,
    publish_status = 1;

-- get_skill 是 Bear MCP 的内置工具：允许管理员角色使用。
INSERT IGNORE INTO mcp_role_tool (role_code, tool_name)
VALUES ('ADMIN', 'get_skill');

-- 给现有 Token 开启 get_skill，避免只配置角色却无法在 tools/list 中看到。
INSERT INTO mcp_user_tool_selection (token_id, tool_name, tool_type, is_enabled)
SELECT id, 'get_skill', 'BUILTIN', 1
FROM mcp_user_token
WHERE NOT EXISTS (
    SELECT 1 FROM mcp_user_tool_selection s
    WHERE s.token_id = mcp_user_token.id
      AND s.tool_name = 'get_skill'
);

-- 日志分析 Skill 依赖的源码只读工具。
INSERT IGNORE INTO mcp_role_tool (role_code, tool_name)
VALUES ('ADMIN', 'run_repository_command');

INSERT INTO mcp_user_tool_selection (token_id, tool_name, tool_type, is_enabled)
SELECT id, 'run_repository_command', 'BUILTIN', 1
FROM mcp_user_token
WHERE NOT EXISTS (
    SELECT 1 FROM mcp_user_tool_selection s
    WHERE s.token_id = mcp_user_token.id
      AND s.tool_name = 'run_repository_command'
);
