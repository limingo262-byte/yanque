-- YanQue 个人数据库 Text-to-SQL 最小演示业务表。
-- 目标数据库：yanque
-- 幂等脚本：只创建不存在的表，只补充固定演示数据，不删除已有业务数据。

USE `yanque`;

CREATE TABLE IF NOT EXISTS `sys_class` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `class_period` VARCHAR(64) NOT NULL COMMENT '班级期数',
    `head_teacher_id` BIGINT NULL COMMENT '班主任 ID',
    `campus_id` BIGINT NULL COMMENT '校区 ID',
    `course_id` BIGINT NULL COMMENT '课程 ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_class_period` (`class_period`),
    KEY `idx_head_teacher_id` (`head_teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级信息';

CREATE TABLE IF NOT EXISTS `student` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_no` VARCHAR(32) NOT NULL,
    `student_name` VARCHAR(50) NOT NULL,
    `student_phone` VARCHAR(30) NULL,
    `gender` VARCHAR(10) NULL COMMENT 'MALE/FEMALE',
    `password` VARCHAR(128) NULL COMMENT '禁止用于 Text-to-SQL 查询',
    `education` VARCHAR(30) NULL,
    `grade_year` INT NULL,
    `school` VARCHAR(100) NULL,
    `major` VARCHAR(100) NULL,
    `teaching_mode` VARCHAR(20) NULL COMMENT 'ONLINE/OFFLINE',
    `class_id` BIGINT NULL,
    `student_tag` VARCHAR(50) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_student_no` (`student_no`),
    UNIQUE KEY `uk_student_phone` (`student_phone`),
    KEY `idx_student_status` (`status`),
    KEY `idx_student_class_id` (`class_id`),
    CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) REFERENCES `sys_class` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生基础档案';

CREATE TABLE IF NOT EXISTS `order_payment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_no` VARCHAR(64) NOT NULL,
    `student_phone` VARCHAR(30) NULL,
    `student_name` VARCHAR(50) NULL,
    `product_id` VARCHAR(64) NULL,
    `order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `refunded_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `prepay_order_no` VARCHAR(32) NULL,
    `status` VARCHAR(30) NOT NULL COMMENT '支付订单状态',
    `unique_order_no` VARCHAR(128) NULL COMMENT '禁止用于 Text-to-SQL 查询',
    `pay_success_time` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_payment_no` (`order_no`),
    KEY `idx_order_payment_student_phone` (`student_phone`),
    KEY `idx_order_payment_status` (`status`),
    KEY `idx_order_payment_success_time` (`pay_success_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付订单流水';

INSERT INTO `sys_class` (`id`, `class_period`, `head_teacher_id`, `campus_id`, `course_id`)
VALUES
    (1, '2026 春季班', 1001, 1, 2001),
    (2, '2026 秋季班', 1002, 1, 2002)
ON DUPLICATE KEY UPDATE `class_period` = VALUES(`class_period`);

INSERT INTO `student`
    (`id`, `student_no`, `student_name`, `student_phone`, `gender`, `password`, `education`, `grade_year`, `school`, `major`, `teaching_mode`, `class_id`, `student_tag`, `status`)
VALUES
    (1, 'YQ2026001', '张同学', '13800000001', 'MALE', 'demo-password', '本科', 2026, '示例大学', '计算机科学', 'ONLINE', 1, 'demo', 'ACTIVE'),
    (2, 'YQ2026002', '李同学', '13800000002', 'FEMALE', 'demo-password', '本科', 2026, '示例学院', '软件工程', 'OFFLINE', 2, 'demo', 'ACTIVE')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`), `class_id` = VALUES(`class_id`), `status` = VALUES(`status`);

INSERT INTO `order_payment`
    (`id`, `order_no`, `student_phone`, `student_name`, `product_id`, `order_amount`, `refunded_amount`, `prepay_order_no`, `status`, `unique_order_no`, `pay_success_time`)
VALUES
    (1, 'YQ-DEMO-ORDER-001', '13800000001', '张同学', 'COURSE-001', 1999.00, 0.00, 'YQ-DEMO-PREPAY-001', 'PAID', NULL, '2026-09-01 10:00:00'),
    (2, 'YQ-DEMO-ORDER-002', '13800000002', '李同学', 'COURSE-002', 2999.00, 500.00, 'YQ-DEMO-PREPAY-002', 'PAID', NULL, '2026-09-02 11:00:00')
ON DUPLICATE KEY UPDATE `order_amount` = VALUES(`order_amount`), `refunded_amount` = VALUES(`refunded_amount`), `status` = VALUES(`status`);

-- 将数据库现有表和字段同步到 Admin 的动态权限目录。
INSERT INTO `ai_text_to_sql_table`
    (`id`, `business_domain`, `business_domain_name`, `table_name`, `table_comment`, `status`, `sort_num`)
SELECT CRC32(t.table_name),
       CASE WHEN t.table_name = 'order_payment' THEN 'order' WHEN t.table_name = 'student' THEN 'student' WHEN t.table_name = 'sys_class' THEN 'teaching' ELSE 'other' END,
       CASE WHEN t.table_name = 'order_payment' THEN '订单' WHEN t.table_name = 'student' THEN '学生' WHEN t.table_name = 'sys_class' THEN '教学' ELSE '其他' END,
       t.table_name, t.table_comment, 'ACTIVE', 100
FROM information_schema.tables t
WHERE t.table_schema = DATABASE() AND t.table_name IN ('student', 'sys_class', 'order_payment')
ON DUPLICATE KEY UPDATE `table_comment` = VALUES(`table_comment`), `status` = 'ACTIVE';

INSERT INTO `ai_text_to_sql_column`
    (`id`, `table_id`, `business_domain`, `business_domain_name`, `table_name`, `table_comment`, `column_name`, `column_comment`, `status`, `sort_num`)
SELECT CRC32(CONCAT(t.table_name, '.', c.column_name)), CRC32(t.table_name),
       CASE WHEN t.table_name = 'order_payment' THEN 'order' WHEN t.table_name = 'student' THEN 'student' WHEN t.table_name = 'sys_class' THEN 'teaching' ELSE 'other' END,
       CASE WHEN t.table_name = 'order_payment' THEN '订单' WHEN t.table_name = 'student' THEN '学生' WHEN t.table_name = 'sys_class' THEN '教学' ELSE '其他' END,
       t.table_name, t.table_comment, c.column_name, c.column_comment, 'ACTIVE', c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE t.table_schema = DATABASE() AND t.table_name IN ('student', 'sys_class', 'order_payment')
ON DUPLICATE KEY UPDATE `column_comment` = VALUES(`column_comment`), `status` = 'ACTIVE';

-- 按数据库中真实存在的 ADMIN 角色授予这 3 张演示表的字段级查询权限。
-- 敏感字段仍由 Text-to-SQL 安全校验拒绝，不在 SQL 生成中使用。
INSERT INTO `ai_text_to_sql_role_permission`
    (`role_id`, `role_code`, `business_domain`, `table_name`, `column_name`, `status`)
SELECT r.id, r.role_code, c.business_domain, c.table_name, c.column_name, 'ACTIVE'
FROM `sys_role` r
JOIN `ai_text_to_sql_column` c ON c.table_name IN ('student', 'sys_class', 'order_payment') AND c.status = 'ACTIVE'
WHERE r.role_code = 'ADMIN' AND r.status = 'ACTIVE'
ON DUPLICATE KEY UPDATE `status` = 'ACTIVE', `role_code` = VALUES(`role_code`);
