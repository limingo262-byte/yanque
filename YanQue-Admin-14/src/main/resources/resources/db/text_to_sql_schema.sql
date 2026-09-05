-- YanQue Text-to-SQL 管理与评测表结构。
-- 幂等脚本：不会删除或覆盖已有业务表。

CREATE TABLE IF NOT EXISTS ai_text_to_sql_table (
    id BIGINT PRIMARY KEY COMMENT '表目录 ID，通常由表名 CRC32 生成',
    business_domain VARCHAR(64) NOT NULL,
    business_domain_name VARCHAR(64) NOT NULL,
    table_name VARCHAR(128) NOT NULL,
    table_comment VARCHAR(512) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    sort_num INT NOT NULL DEFAULT 100,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    UNIQUE KEY uk_text_to_sql_table_name (table_name),
    KEY idx_text_to_sql_table_domain (business_domain, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Text-to-SQL 可查询表目录';

CREATE TABLE IF NOT EXISTS ai_text_to_sql_column (
    id BIGINT PRIMARY KEY COMMENT '字段目录 ID，通常由表名和字段名 CRC32 生成',
    table_id BIGINT NOT NULL,
    business_domain VARCHAR(64) NOT NULL,
    business_domain_name VARCHAR(64) NOT NULL,
    table_name VARCHAR(128) NOT NULL,
    table_comment VARCHAR(512) NULL,
    column_name VARCHAR(128) NOT NULL,
    column_comment VARCHAR(512) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    sort_num INT NOT NULL DEFAULT 100,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    UNIQUE KEY uk_text_to_sql_column_name (table_name, column_name),
    KEY idx_text_to_sql_column_table (table_id),
    KEY idx_text_to_sql_column_domain (business_domain, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Text-to-SQL 可查询字段目录';

CREATE TABLE IF NOT EXISTS ai_text_to_sql_role_permission (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    role_code VARCHAR(64) NOT NULL,
    business_domain VARCHAR(64) NOT NULL,
    table_name VARCHAR(128) NOT NULL,
    column_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_text_to_sql_role_column (role_id, table_name, column_name),
    KEY idx_text_to_sql_role_code (role_code, status),
    KEY idx_text_to_sql_permission_column (business_domain, table_name, column_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Text-to-SQL 角色字段权限';

CREATE TABLE IF NOT EXISTS ai_text_to_sql_run (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(128) NOT NULL,
    source_type VARCHAR(32) NOT NULL DEFAULT 'CHAT',
    original_question TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'RUNNING',
    error_message TEXT NULL,
    state_snapshot_json LONGTEXT NULL,
    state_history_json LONGTEXT NULL,
    duration_ms BIGINT NULL,
    feedback_result VARCHAR(32) NULL,
    feedback_comment VARCHAR(1000) NULL,
    feedback_at DATETIME NULL,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_text_to_sql_run_conversation (conversation_id),
    KEY idx_text_to_sql_run_status (status),
    KEY idx_text_to_sql_run_created (created_at),
    KEY idx_text_to_sql_run_source (source_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Text-to-SQL 运行记录';

CREATE TABLE IF NOT EXISTS ai_text_to_sql_eval_question (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL,
    business_domain VARCHAR(64) NULL,
    eval_target VARCHAR(64) NULL,
    sample_category VARCHAR(64) NULL,
    source_type VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
    source_run_id BIGINT NULL,
    judge_note TEXT NULL,
    remark VARCHAR(1000) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_text_to_sql_eval_question_status (status),
    KEY idx_text_to_sql_eval_question_domain (business_domain),
    KEY idx_text_to_sql_eval_question_source_run (source_run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Text-to-SQL 评测样本';

CREATE TABLE IF NOT EXISTS ai_text_to_sql_eval_assertion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    eval_question_id BIGINT NOT NULL,
    actual_key VARCHAR(255) NOT NULL,
    operator VARCHAR(32) NOT NULL,
    expected_value TEXT NULL,
    required TINYINT(1) NOT NULL DEFAULT 1,
    weight DECIMAL(10,4) NULL,
    failure_type VARCHAR(64) NULL,
    reference_answer TEXT NULL,
    key_points TEXT NULL,
    forbidden_points TEXT NULL,
    min_score INT NULL,
    sort_order INT NOT NULL DEFAULT 100,
    remark VARCHAR(1000) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_text_to_sql_assertion_question (eval_question_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Text-to-SQL 评测断言';

CREATE TABLE IF NOT EXISTS ai_text_to_sql_eval_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_domain VARCHAR(64) NULL,
    eval_target VARCHAR(64) NULL,
    sample_category VARCHAR(64) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    total_count INT NOT NULL DEFAULT 0,
    pass_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    interrupted_count INT NOT NULL DEFAULT 0,
    pass_rate DECIMAL(10,4) NOT NULL DEFAULT 0,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,
    duration_ms BIGINT NULL,
    error_message TEXT NULL,
    created_by BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_text_to_sql_eval_task_status (status),
    KEY idx_text_to_sql_eval_task_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Text-to-SQL 评测任务';

CREATE TABLE IF NOT EXISTS ai_text_to_sql_eval_result (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    eval_task_id BIGINT NOT NULL,
    eval_question_id BIGINT NOT NULL,
    run_record_id BIGINT NULL,
    question TEXT NOT NULL,
    result_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    passed TINYINT(1) NULL,
    score DECIMAL(10,4) NULL,
    state_snapshot_json LONGTEXT NULL,
    state_history_json LONGTEXT NULL,
    error_message TEXT NULL,
    duration_ms BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_text_to_sql_eval_result_task (eval_task_id, passed, id),
    KEY idx_text_to_sql_eval_result_question (eval_question_id),
    KEY idx_text_to_sql_eval_result_run (run_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Text-to-SQL 单条样本评测结果';

CREATE TABLE IF NOT EXISTS ai_text_to_sql_eval_assertion_result (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    eval_result_id BIGINT NOT NULL,
    eval_assertion_id BIGINT NOT NULL,
    actual_key VARCHAR(255) NOT NULL,
    operator VARCHAR(32) NOT NULL,
    expected_value TEXT NULL,
    actual_value LONGTEXT NULL,
    required TINYINT(1) NOT NULL DEFAULT 1,
    passed TINYINT(1) NULL,
    score DECIMAL(10,4) NULL,
    failure_type VARCHAR(64) NULL,
    reason TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_text_to_sql_assertion_result_result (eval_result_id),
    KEY idx_text_to_sql_assertion_result_assertion (eval_assertion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Text-to-SQL 单条断言评测结果';
