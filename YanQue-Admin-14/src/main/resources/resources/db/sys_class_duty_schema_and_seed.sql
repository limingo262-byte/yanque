USE yanque;
CREATE TABLE IF NOT EXISTS sys_class_duty (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '值班ID',
  class_id BIGINT DEFAULT NULL COMMENT '班级ID，校区统一值班为空',
  campus_id BIGINT NOT NULL COMMENT '校区ID',
  teacher_id BIGINT NOT NULL COMMENT '老师ID',
  duty_date DATE NOT NULL COMMENT '值班日期',
  duty_type VARCHAR(50) NOT NULL COMMENT '值班类型：EVENING_STUDY_CLASS/EVENING_STUDY_CAMPUS/SELF_STUDY_CLASS',
  start_time VARCHAR(10) NOT NULL COMMENT '开始时间',
  end_time VARCHAR(10) NOT NULL COMMENT '结束时间',
  remark VARCHAR(255) DEFAULT NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_class_date (class_id, duty_date),
  KEY idx_campus_date (campus_id, duty_date),
  KEY idx_teacher_date (teacher_id, duty_date),
  KEY idx_duty_type (duty_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='值班表';