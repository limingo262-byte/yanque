CREATE TABLE IF NOT EXISTS ai_chat_session (
  id BIGINT NOT NULL AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '新对话',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  summary LONGTEXT NULL,
  last_compressed_message_id BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_chat_session_student_status_updated (student_id, status, updated_at),
  CONSTRAINT fk_ai_chat_session_student
    FOREIGN KEY (student_id) REFERENCES student (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_chat_message (
  id BIGINT NOT NULL AUTO_INCREMENT,
  session_id BIGINT NOT NULL,
  role VARCHAR(20) NOT NULL,
  content LONGTEXT NOT NULL,
  model VARCHAR(100) NULL,
  tokens INT NULL,
  compressed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_chat_message_session_created (session_id, created_at, id),
  KEY idx_ai_chat_message_session_compressed (session_id, compressed, id),
  CONSTRAINT fk_ai_chat_message_session
    FOREIGN KEY (session_id) REFERENCES ai_chat_session (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
