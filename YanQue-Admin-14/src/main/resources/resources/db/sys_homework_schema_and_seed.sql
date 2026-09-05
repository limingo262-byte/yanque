CREATE TABLE IF NOT EXISTS sys_homework (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content_object_key VARCHAR(500) NOT NULL,
  content_file_name VARCHAR(255) NOT NULL,
  answer_object_key VARCHAR(500) NULL,
  answer_file_name VARCHAR(255) NULL,
  answer_student_visible TINYINT(1) NOT NULL DEFAULT 0,
  class_id BIGINT NOT NULL,
  homework_date DATE NOT NULL,
  class_content VARCHAR(1000) NOT NULL,
  start_time DATETIME NOT NULL,
  deadline DATETIME NOT NULL,
  remark VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_homework_class_date (class_id, homework_date),
  KEY idx_homework_date (homework_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业';

CREATE TABLE IF NOT EXISTS sys_homework_submission (
  id BIGINT NOT NULL AUTO_INCREMENT,
  homework_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  class_id BIGINT NOT NULL,
  content_object_key VARCHAR(500) NOT NULL,
  content_file_name VARCHAR(255) NOT NULL,
  submit_time DATETIME NOT NULL,
  late_submitted TINYINT(1) NOT NULL DEFAULT 0,
  teacher_remark VARCHAR(500) NULL,
  score DECIMAL(5,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_homework_student (homework_id, student_id),
  KEY idx_submission_homework (homework_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业提交';

SET @has_class_id = (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'sys_homework_submission' AND column_name = 'class_id');
SET @add_class_id = IF(@has_class_id = 0,
  'ALTER TABLE sys_homework_submission ADD COLUMN class_id BIGINT NOT NULL AFTER student_id, ADD KEY idx_submission_class(class_id)',
  'SELECT 1');
PREPARE stmt FROM @add_class_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
