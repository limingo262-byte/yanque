CREATE TABLE IF NOT EXISTS `exam_paper` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
  `paper_name` varchar(128) NOT NULL COMMENT '试卷名称',
  `course_id` bigint NOT NULL COMMENT '课程ID',
  `stage_name` varchar(64) DEFAULT NULL COMMENT '阶段名称，为空表示整门课程考试',
  `total_score` decimal(10,1) NOT NULL COMMENT '总分数',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_paper_course_stage` (`course_id`,`stage_name`),
  KEY `idx_exam_paper_name` (`paper_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试卷表';

CREATE TABLE IF NOT EXISTS `exam_paper_question` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `paper_id` bigint NOT NULL COMMENT '试卷ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `question_score` decimal(10,1) NOT NULL COMMENT '题目分数',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_paper_question` (`paper_id`,`question_id`),
  KEY `idx_exam_paper_question_paper` (`paper_id`),
  KEY `idx_exam_paper_question_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试卷题目关联表';

CREATE TABLE IF NOT EXISTS `exam` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '考试ID',
  `paper_id` bigint NOT NULL COMMENT '试卷ID',
  `class_id` bigint NOT NULL COMMENT '班级ID',
  `start_time` datetime NOT NULL COMMENT '可进入考试开始时间',
  `end_time` datetime NOT NULL COMMENT '可进入考试截止时间',
  `duration_minutes` int NOT NULL COMMENT '学生个人答题时长，单位分钟',
  `invigilator_user_id` mediumtext NOT NULL COMMENT '监考老师',
  `answer_visible` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否向学生公布答卷判定结果',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_paper` (`paper_id`),
  KEY `idx_exam_class_time` (`class_id`,`start_time`,`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试安排表';
