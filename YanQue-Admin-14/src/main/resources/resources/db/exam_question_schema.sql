CREATE TABLE IF NOT EXISTS exam_question (
 id bigint NOT NULL AUTO_INCREMENT, question_type varchar(32) NOT NULL, question_content text NOT NULL,
 answer_content text NOT NULL, analysis_content text NULL, difficulty varchar(32) NOT NULL DEFAULT 'NORMAL',
 status varchar(32) NOT NULL DEFAULT 'ENABLED', created_at datetime NOT NULL, updated_at datetime NOT NULL,
 PRIMARY KEY(id), KEY idx_exam_question_type(question_type), KEY idx_exam_question_status(status), KEY idx_exam_question_difficulty(difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题库题目表';
CREATE TABLE IF NOT EXISTS exam_question_option (
 id bigint NOT NULL AUTO_INCREMENT, question_id bigint NOT NULL, option_key varchar(16) NOT NULL,
 option_content text NOT NULL, sort_order int NOT NULL DEFAULT 0, created_at datetime NOT NULL, updated_at datetime NOT NULL,
 PRIMARY KEY(id), UNIQUE KEY uk_exam_question_option_key(question_id,option_key), KEY idx_exam_question_option_question(question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目选项表';
CREATE TABLE IF NOT EXISTS exam_question_course (
 question_id bigint NOT NULL, course_id bigint NOT NULL, stage_name varchar(64) NOT NULL, created_at datetime NOT NULL,
 PRIMARY KEY(question_id,course_id), KEY idx_exam_question_course_course(course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目关联课程表';
