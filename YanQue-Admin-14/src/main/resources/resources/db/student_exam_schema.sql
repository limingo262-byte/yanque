CREATE TABLE IF NOT EXISTS `student_exam_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学生考试记录ID',
  `exam_id` bigint NOT NULL COMMENT '考试ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `start_time` datetime NOT NULL COMMENT '实际开始答题时间',
  `deadline_time` datetime NOT NULL COMMENT '当前学生本次考试截止时间',
  `submit_time` datetime DEFAULT NULL COMMENT '提交时间',
  `status` varchar(32) NOT NULL COMMENT '状态：IN_PROGRESS/SUBMITTED/TIMEOUT',
  `grading_status` varchar(32) NOT NULL DEFAULT 'PENDING' COMMENT '批改状态：PENDING/GRADING/COMPLETED',
  `score` decimal(10,2) DEFAULT NULL COMMENT '得分',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_student` (`exam_id`,`student_id`),
  KEY `idx_student_exam_record_student` (`student_id`,`status`),
  KEY `idx_student_exam_record_exam` (`exam_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生考试记录表';

CREATE TABLE IF NOT EXISTS `student_exam_answer` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学生考试答案ID',
  `record_id` bigint NOT NULL COMMENT '学生考试记录ID',
  `exam_id` bigint NOT NULL COMMENT '考试ID',
  `paper_id` bigint NOT NULL COMMENT '试卷ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `question_type` varchar(32) NOT NULL COMMENT '题型',
  `question_score` decimal(10,2) NOT NULL COMMENT '题目分数',
  `answer_content` text COMMENT '学生答案内容',
  `correct` tinyint(1) DEFAULT NULL COMMENT '是否正确，主观题/编程题可为空',
  `score` decimal(10,2) DEFAULT NULL COMMENT '本题得分',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_record_question` (`record_id`,`question_id`),
  KEY `idx_student_exam_answer_record` (`record_id`),
  KEY `idx_student_exam_answer_exam` (`exam_id`),
  KEY `idx_student_exam_answer_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生考试答案表';
