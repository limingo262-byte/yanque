-- 校区表
CREATE TABLE IF NOT EXISTS sys_campus (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '校区ID',
  campus_location VARCHAR(255) NOT NULL COMMENT '校区地点',
  manager_name VARCHAR(64) NOT NULL COMMENT '负责人',
  manager_phone VARCHAR(32) NOT NULL COMMENT '负责人电话',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_campus_location (campus_location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='校区表';

INSERT INTO sys_campus (id, campus_location, manager_name, manager_phone, created_at, updated_at)
VALUES
(1, '长沙岳麓校区', '张老师', '13800001111', NOW(), NOW()),
(2, '长沙星沙校区', '李老师', '13800002222', NOW(), NOW()),
(3, '株洲河西校区', '王老师', '13800003333', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  manager_name = VALUES(manager_name),
  manager_phone = VALUES(manager_phone),
  updated_at = NOW();

ALTER TABLE sys_campus AUTO_INCREMENT = 100;