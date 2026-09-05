USE yanque;
INSERT INTO sys_role (id, role_code, role_name, description, status)
VALUES (4, 'SUPER_ADMIN', '超级管理员', '拥有全部权限，权限拦截器直接放行', 'ACTIVE')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description), status = VALUES(status);

-- admin 同时绑定 SUPER_ADMIN，便于直接放行
INSERT INTO sys_user_role (user_id, role_id)
SELECT 1, 4 FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM sys_user_role WHERE user_id = 1 AND role_id = 4
);

-- SUPER_ADMIN 拥有全部权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 4, p.id FROM sys_permission p
WHERE NOT EXISTS (
  SELECT 1 FROM sys_role_permission rp WHERE rp.role_id = 4 AND rp.permission_id = p.id
);