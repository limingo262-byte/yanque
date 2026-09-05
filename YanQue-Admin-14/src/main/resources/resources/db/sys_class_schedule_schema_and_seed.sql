USE yanque;

CREATE TABLE IF NOT EXISTS sys_class_schedule (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '课表ID',
  class_id BIGINT NOT NULL COMMENT '班级ID',
  teacher_id BIGINT DEFAULT NULL COMMENT '老师ID',
  schedule_date DATE NOT NULL COMMENT '上课日期',
  course_detail_id BIGINT DEFAULT NULL COMMENT '课程详情ID',
  course_content VARCHAR(1000) NOT NULL COMMENT '课程内容',
  class_type VARCHAR(32) NOT NULL COMMENT '上课类型：CLASS/SELF_STUDY/HOLIDAY/REST',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_class_date (class_id, schedule_date),
  KEY idx_teacher_id (teacher_id),
  KEY idx_course_detail_id (course_detail_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='班级课表表';

-- 排课规则：周一/二/三/五/六上课，周四自习，周日休息，法定节假日放假
-- weekday：周一=1 ... 周日=7
INSERT INTO sys_config (k, v)
VALUES (
  'teaching.schedule.rule',
  '{"classDays":[1,2,3,5,6],"selfStudyDays":[4],"restDays":[7],"holidayRest":true}'
)
ON DUPLICATE KEY UPDATE v = VALUES(v);