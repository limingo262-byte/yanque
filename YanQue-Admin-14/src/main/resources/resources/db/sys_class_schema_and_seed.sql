CREATE TABLE IF NOT EXISTS sys_class (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '班级ID',
  class_period VARCHAR(64) NOT NULL COMMENT '班级期数',
  head_teacher_id BIGINT NOT NULL COMMENT '班主任ID',
  campus_id BIGINT NOT NULL COMMENT '校区ID',
  course_id BIGINT NOT NULL COMMENT '课程ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_class_period (class_period),
  KEY idx_head_teacher_id (head_teacher_id),
  KEY idx_campus_id (campus_id),
  KEY idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级表';

INSERT INTO sys_role (role_code, role_name, description, status)
VALUES ('HEAD_TEACHER', '班主任', '班级班主任角色', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  role_name = VALUES(role_name),
  description = VALUES(description),
  status = VALUES(status),
  updated_at = NOW();

INSERT INTO sys_user_role (user_id, role_id, created_at)
SELECT u.id, r.id, NOW()
FROM sys_user u
JOIN sys_role r ON r.role_code = 'HEAD_TEACHER'
WHERE u.username = 'teacher01'
  AND NOT EXISTS (
    SELECT 1 FROM sys_user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

DELETE FROM sys_class WHERE id IN (1,2);

INSERT INTO sys_class (id, class_period, head_teacher_id, campus_id, course_id)
SELECT 1, 'Java2401期', u.id,
  (SELECT id FROM sys_campus ORDER BY id LIMIT 1),
  (SELECT id FROM sys_course WHERE teaching_mode='OFFLINE' ORDER BY id LIMIT 1)
FROM sys_user u WHERE u.username='teacher01';

INSERT INTO sys_class (id, class_period, head_teacher_id, campus_id, course_id)
SELECT 2, 'AI2402期', u.id,
  (SELECT id FROM sys_campus ORDER BY id DESC LIMIT 1),
  (SELECT id FROM sys_course ORDER BY id DESC LIMIT 1)
FROM sys_user u WHERE u.username='teacher01';

ALTER TABLE sys_class AUTO_INCREMENT = 100;

SELECT c.id, c.class_period, c.head_teacher_id, u.nickname, c.campus_id, camp.campus_location, c.course_id, co.course_name
FROM sys_class c
LEFT JOIN sys_user u ON u.id=c.head_teacher_id
LEFT JOIN sys_campus camp ON camp.id=c.campus_id
LEFT JOIN sys_course co ON co.id=c.course_id;

SELECT id, role_code, role_name FROM sys_role WHERE role_code='HEAD_TEACHER';