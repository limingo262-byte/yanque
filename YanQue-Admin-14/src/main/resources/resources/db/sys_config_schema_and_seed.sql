USE yanque;

CREATE TABLE IF NOT EXISTS sys_config (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    k VARCHAR(100) NOT NULL COMMENT '配置键',
    v VARCHAR(2000) NOT NULL COMMENT '配置值',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_config_key (k)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统参数配置表';

INSERT INTO sys_config (id, k, v)
VALUES
(1, 'system.name', 'YanQue Admin'),
(2, 'system.logo', 'YQ'),
(3, 'upload.maxSizeMb', '20'),
(4, 'login.captchaEnabled', 'false')
ON DUPLICATE KEY UPDATE v = VALUES(v);

ALTER TABLE sys_config AUTO_INCREMENT = 100;

INSERT INTO sys_config (k, v)
VALUES
('teaching.schedule.rule', '{"classDays":[1,2,3,5,6],"selfStudyDays":[4],"restDays":[7],"holidayRest":true}')
ON DUPLICATE KEY UPDATE v = VALUES(v);
