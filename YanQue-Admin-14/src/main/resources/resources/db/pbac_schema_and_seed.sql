-- =========================================================
-- PBAC 表结构对齐脚本（按对话约定）
-- 数据库：yanque
-- 说明：
-- 1. 会重建 sys_role / sys_permission / sys_user_role / sys_role_permission
-- 2. 保留 sys_user 基础结构，并补充初始化账号
-- 3. 权限按 MENU / BUTTON / API 树形组织
-- =========================================================

CREATE DATABASE IF NOT EXISTS yanque
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE yanque;

-- ----------------------------
-- 系统用户表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '登录用户名',
    password VARCHAR(100) NOT NULL COMMENT '登录密码（当前测试阶段可明文）',
    nickname VARCHAR(50) NULL COMMENT '展示昵称',
    real_name VARCHAR(50) NULL COMMENT '真实姓名',
    phone VARCHAR(20) NULL COMMENT '手机号',
    email VARCHAR(100) NULL COMMENT '邮箱',
    union_id VARCHAR(100) NULL COMMENT '飞书 union_id',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态，ACTIVE启用，INACTIVE禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 若旧表字段约束不一致，尽量对齐（兼容已有库）
ALTER TABLE sys_user
    MODIFY COLUMN username VARCHAR(50) NOT NULL COMMENT '登录用户名',
    MODIFY COLUMN password VARCHAR(100) NOT NULL COMMENT '登录密码（当前测试阶段可明文）',
    MODIFY COLUMN nickname VARCHAR(50) NULL COMMENT '展示昵称',
    MODIFY COLUMN real_name VARCHAR(50) NULL COMMENT '真实姓名',
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态，ACTIVE启用，INACTIVE禁用',
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- ----------------------------
-- 角色表
-- ----------------------------
DROP TABLE IF EXISTS sys_role_permission;
DROP TABLE IF EXISTS sys_user_role;
DROP TABLE IF EXISTS sys_permission;
DROP TABLE IF EXISTS sys_role;

CREATE TABLE sys_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    role_code VARCHAR(64) NOT NULL UNIQUE COMMENT '角色编码，系统内唯一',
    role_name VARCHAR(64) NOT NULL COMMENT '角色名称',
    description VARCHAR(255) NULL COMMENT '角色描述',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态，ACTIVE启用，INACTIVE禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_role_code (role_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色表';

-- ----------------------------
-- 权限表（支持树形）
-- ----------------------------
CREATE TABLE sys_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    parent_id BIGINT NOT NULL DEFAULT 0 COMMENT '父权限ID，根节点为0',
    permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码，系统内唯一',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    permission_type VARCHAR(32) NOT NULL COMMENT '权限类型：API、MENU、BUTTON',
    api_path VARCHAR(255) NULL COMMENT 'API路径匹配规则，格式: METHOD /path，仅API权限使用',
    sort_num INT NOT NULL DEFAULT 0 COMMENT '排序值，越小越靠前',
    description VARCHAR(255) NULL COMMENT '权限描述',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态，ACTIVE启用，INACTIVE禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_parent_id (parent_id),
    INDEX idx_permission_code (permission_code),
    INDEX idx_permission_type (permission_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统权限表';

-- ----------------------------
-- 用户角色关联表
-- ----------------------------
CREATE TABLE sys_user_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_role (user_id, role_id) COMMENT '用户角色唯一约束',
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- ----------------------------
-- 角色权限关联表
-- ----------------------------
CREATE TABLE sys_role_permission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_role_permission (role_id, permission_id) COMMENT '角色权限唯一约束',
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- =========================================================
-- 初始化数据
-- =========================================================

-- 用户：存在则更新，不存在则插入
INSERT INTO sys_user (id, username, password, nickname, real_name, phone, email, union_id, status)
VALUES
(1, 'admin', '123456', '管理员', '系统管理员', '13800138000', 'admin@yanque.local', 'on_admin_demo', 'ACTIVE'),
(2, 'teacher01', '123456', '讲师一号', '张老师', '13800138001', 'teacher01@yanque.local', 'on_teacher_demo', 'ACTIVE'),
(3, 'operator01', '123456', '运营一号', '李运营', '13800138002', 'operator01@yanque.local', 'on_operator_demo', 'ACTIVE')
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    nickname = VALUES(nickname),
    real_name = VALUES(real_name),
    phone = VALUES(phone),
    email = VALUES(email),
    union_id = VALUES(union_id),
    status = VALUES(status);

-- 角色
INSERT INTO sys_role (id, role_code, role_name, description, status) VALUES
(1, 'ADMIN', '系统管理员', '拥有用户、角色、权限的完整管理权限', 'ACTIVE'),
(2, 'TEACHER', '讲师', '可查看用户、角色、权限数据', 'ACTIVE'),
(3, 'OPERATOR', '运营', '可维护用户资料，并查看角色权限信息', 'ACTIVE');

-- 权限树
-- 一级菜单
INSERT INTO sys_permission
(id, parent_id, permission_code, permission_name, permission_type, api_path, sort_num, description, status)
VALUES
(1, 0, 'system', '系统管理', 'MENU', NULL, 10, '系统管理一级菜单', 'ACTIVE'),
(2, 1, 'system:user', '用户管理', 'MENU', NULL, 11, '用户管理菜单', 'ACTIVE'),
(3, 1, 'system:role', '角色管理', 'MENU', NULL, 12, '角色管理菜单', 'ACTIVE'),
(4, 1, 'system:permission', '权限管理', 'MENU', NULL, 13, '权限管理菜单', 'ACTIVE');

-- 用户管理按钮 + API
INSERT INTO sys_permission
(id, parent_id, permission_code, permission_name, permission_type, api_path, sort_num, description, status)
VALUES
(10, 2, 'system:user:page', '用户分页查询', 'API', 'GET /api/sysUser', 10, '分页查询用户', 'ACTIVE'),
(11, 2, 'system:user:detail', '用户详情', 'API', 'GET /api/sysUser/{id}', 20, '查询用户详情', 'ACTIVE'),
(12, 2, 'system:user:create', '新增用户', 'BUTTON', NULL, 30, '新增用户按钮', 'ACTIVE'),
(13, 12, 'system:user:create:api', '新增用户接口', 'API', 'POST /api/sysUser', 10, '新增用户接口', 'ACTIVE'),
(14, 2, 'system:user:update', '修改用户', 'BUTTON', NULL, 40, '修改用户按钮', 'ACTIVE'),
(15, 14, 'system:user:update:api', '修改用户接口', 'API', 'PUT /api/sysUser/{id}', 10, '修改用户接口', 'ACTIVE'),
(16, 2, 'system:user:delete', '删除用户', 'BUTTON', NULL, 50, '删除用户按钮', 'ACTIVE'),
(17, 16, 'system:user:delete:api', '删除用户接口', 'API', 'DELETE /api/sysUser/{id}', 10, '删除用户接口', 'ACTIVE'),
(18, 2, 'system:user:assignRole', '分配角色', 'BUTTON', NULL, 60, '用户分配角色按钮', 'ACTIVE'),
(19, 18, 'system:user:assignRole:api', '分配角色接口', 'API', 'PUT /api/sysUser/{id}/roles', 10, '用户分配角色接口', 'ACTIVE');

-- 角色管理按钮 + API
INSERT INTO sys_permission
(id, parent_id, permission_code, permission_name, permission_type, api_path, sort_num, description, status)
VALUES
(20, 3, 'system:role:page', '角色分页查询', 'API', 'GET /api/sysRole', 10, '分页查询角色', 'ACTIVE'),
(21, 3, 'system:role:detail', '角色详情', 'API', 'GET /api/sysRole/{id}', 20, '查询角色详情', 'ACTIVE'),
(22, 3, 'system:role:create', '新增角色', 'BUTTON', NULL, 30, '新增角色按钮', 'ACTIVE'),
(23, 22, 'system:role:create:api', '新增角色接口', 'API', 'POST /api/sysRole', 10, '新增角色接口', 'ACTIVE'),
(24, 3, 'system:role:update', '修改角色', 'BUTTON', NULL, 40, '修改角色按钮', 'ACTIVE'),
(25, 24, 'system:role:update:api', '修改角色接口', 'API', 'PUT /api/sysRole/{id}', 10, '修改角色接口', 'ACTIVE'),
(26, 3, 'system:role:delete', '删除角色', 'BUTTON', NULL, 50, '删除角色按钮', 'ACTIVE'),
(27, 26, 'system:role:delete:api', '删除角色接口', 'API', 'DELETE /api/sysRole/{id}', 10, '删除角色接口', 'ACTIVE'),
(28, 3, 'system:role:assignPermission', '分配权限', 'BUTTON', NULL, 60, '角色分配权限按钮', 'ACTIVE'),
(29, 28, 'system:role:assignPermission:api', '分配权限接口', 'API', 'PUT /api/sysRole/{id}/permissions', 10, '角色分配权限接口', 'ACTIVE');

-- 权限管理按钮 + API
INSERT INTO sys_permission
(id, parent_id, permission_code, permission_name, permission_type, api_path, sort_num, description, status)
VALUES
(30, 4, 'system:permission:page', '权限分页查询', 'API', 'GET /api/sysPermission', 10, '分页查询权限', 'ACTIVE'),
(31, 4, 'system:permission:tree', '权限树查询', 'API', 'GET /api/sysPermission/tree', 20, '查询权限树', 'ACTIVE'),
(32, 4, 'system:permission:detail', '权限详情', 'API', 'GET /api/sysPermission/{id}', 30, '查询权限详情', 'ACTIVE'),
(33, 4, 'system:permission:create', '新增权限', 'BUTTON', NULL, 40, '新增权限按钮', 'ACTIVE'),
(34, 33, 'system:permission:create:api', '新增权限接口', 'API', 'POST /api/sysPermission', 10, '新增权限接口', 'ACTIVE'),
(35, 4, 'system:permission:update', '修改权限', 'BUTTON', NULL, 50, '修改权限按钮', 'ACTIVE'),
(36, 35, 'system:permission:update:api', '修改权限接口', 'API', 'PUT /api/sysPermission/{id}', 10, '修改权限接口', 'ACTIVE'),
(37, 4, 'system:permission:delete', '删除权限', 'BUTTON', NULL, 60, '删除权限按钮', 'ACTIVE'),
(38, 37, 'system:permission:delete:api', '删除权限接口', 'API', 'DELETE /api/sysPermission/{id}', 10, '删除权限接口', 'ACTIVE');

-- 用户角色
INSERT INTO sys_user_role (user_id, role_id) VALUES
(1, 1),
(2, 2),
(3, 3);

-- 管理员：全部权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission;

-- 讲师：仅查看类权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 2, id FROM sys_permission
WHERE permission_code IN (
    'system',
    'system:user',
    'system:role',
    'system:permission',
    'system:user:page',
    'system:user:detail',
    'system:role:page',
    'system:role:detail',
    'system:permission:page',
    'system:permission:tree',
    'system:permission:detail'
);

-- 运营：用户维护 + 角色/权限查看
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 3, id FROM sys_permission
WHERE permission_code IN (
    'system',
    'system:user',
    'system:role',
    'system:permission',
    'system:user:page',
    'system:user:detail',
    'system:user:create',
    'system:user:create:api',
    'system:user:update',
    'system:user:update:api',
    'system:user:assignRole',
    'system:user:assignRole:api',
    'system:role:page',
    'system:role:detail',
    'system:permission:page',
    'system:permission:tree',
    'system:permission:detail'
);

-- 重置自增，避免后续插入冲突
ALTER TABLE sys_user AUTO_INCREMENT = 100;
ALTER TABLE sys_role AUTO_INCREMENT = 100;
ALTER TABLE sys_permission AUTO_INCREMENT = 100;
ALTER TABLE sys_user_role AUTO_INCREMENT = 100;
ALTER TABLE sys_role_permission AUTO_INCREMENT = 100;