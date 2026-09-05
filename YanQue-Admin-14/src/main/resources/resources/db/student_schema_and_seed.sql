CREATE TABLE IF NOT EXISTS student (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '学生ID',
  student_no VARCHAR(32) NOT NULL COMMENT '学员编号',
  student_name VARCHAR(50) NOT NULL COMMENT '学生姓名',
  student_phone VARCHAR(30) NOT NULL COMMENT '手机号',
  gender VARCHAR(10) NULL,
  password VARCHAR(128) NOT NULL COMMENT '登录密码',
  education VARCHAR(30) NOT NULL,
  grade_year INT NOT NULL,
  school VARCHAR(100) NOT NULL,
  major VARCHAR(100) NULL,
  teaching_mode VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
  class_id BIGINT NULL,
  student_tag VARCHAR(50) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_student_no (student_no),
  UNIQUE KEY uk_student_phone (student_phone),
  KEY idx_student_class (class_id),
  KEY idx_student_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生';

INSERT INTO student(student_no,student_name,student_phone,password,education,grade_year,school,major,
                    teaching_mode,class_id,status)
SELECT 'STU202607270001','联调学生','13293920178','123456','本科',2026,'测试院校','计算机科学与技术',
       'OFFLINE',c.id,'ACTIVE'
FROM sys_class c ORDER BY c.id LIMIT 1
ON DUPLICATE KEY UPDATE student_name=VALUES(student_name),password=VALUES(password),
  class_id=VALUES(class_id),status='ACTIVE',updated_at=NOW();
