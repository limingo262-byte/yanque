-- 课程主表 + 课程详情表结构与示例数据
CREATE TABLE IF NOT EXISTS sys_course (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '课程ID',
  course_name VARCHAR(128) NOT NULL COMMENT '课程名称',
  course_days INT NOT NULL COMMENT '课程天数',
  teaching_mode VARCHAR(20) NOT NULL DEFAULT 'ONLINE' COMMENT '上课方式：ONLINE线上，OFFLINE线下',
  material_path VARCHAR(500) NOT NULL COMMENT '资料路径',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_course_name (course_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

CREATE TABLE IF NOT EXISTS sys_course_detail (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '课程详情ID',
  course_id BIGINT NOT NULL COMMENT '课程ID',
  stage_name VARCHAR(128) NOT NULL COMMENT '阶段',
  day_number INT DEFAULT NULL COMMENT '第几天，线下课程使用',
  class_content VARCHAR(1000) DEFAULT NULL COMMENT '上课内容，线下课程使用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程详情表';

-- 清理旧示例数据后重新灌入
DELETE FROM sys_course_detail WHERE course_id IN (1, 2, 3, 4);
DELETE FROM sys_course WHERE id IN (1, 2, 3, 4);

INSERT INTO sys_course (id, course_name, course_days, teaching_mode, material_path, created_at, updated_at) VALUES
(1, 'Java全栈工程师线上课', 90, 'ONLINE', '/materials/java-fullstack-online', NOW(), NOW()),
(2, 'Java线下实训营', 16, 'OFFLINE', '/materials/java-offline-bootcamp', NOW(), NOW()),
(3, 'Spring Boot微服务线上专项', 20, 'ONLINE', '/materials/springboot-cloud-online', NOW(), NOW()),
(4, 'AI应用开发线下特训', 8, 'OFFLINE', '/materials/ai-offline', NOW(), NOW());

-- 线上课：只维护阶段名称
INSERT INTO sys_course_detail (course_id, stage_name, day_number, class_content, created_at, updated_at) VALUES
(1, 'Java基础阶段', NULL, NULL, NOW(), NOW()),
(1, '集合与IO阶段', NULL, NULL, NOW(), NOW()),
(1, '多线程与JVM阶段', NULL, NULL, NOW(), NOW()),
(1, '框架阶段(Spring/SpringMVC/MyBatis)', NULL, NULL, NOW(), NOW()),
(1, 'Spring Boot阶段', NULL, NULL, NOW(), NOW()),
(1, 'Spring Cloud阶段', NULL, NULL, NOW(), NOW()),
(1, '项目阶段', NULL, NULL, NOW(), NOW()),
(1, 'AI课程阶段', NULL, NULL, NOW(), NOW()),
(3, 'Spring Boot基础', NULL, NULL, NOW(), NOW()),
(3, 'Spring Cloud Alibaba', NULL, NULL, NOW(), NOW()),
(3, '网关与认证授权', NULL, NULL, NOW(), NOW()),
(3, '分布式事务与链路追踪', NULL, NULL, NOW(), NOW()),
(3, '微服务项目实战', NULL, NULL, NOW(), NOW());

-- 线下课：阶段 + 第几天 + 上课内容
INSERT INTO sys_course_detail (course_id, stage_name, day_number, class_content, created_at, updated_at) VALUES
-- Java线下实训营
(2, 'Java基础阶段', 1, '环境搭建：JDK、IDEA、Maven；HelloWorld 与基础语法', NOW(), NOW()),
(2, 'Java基础阶段', 2, '数据类型、运算符、流程控制与方法', NOW(), NOW()),
(2, 'Java基础阶段', 3, '面向对象：封装、继承、多态、抽象类与接口', NOW(), NOW()),
(2, 'Java基础阶段', 4, '常用API：String、集合入门、异常处理', NOW(), NOW()),
(2, '框架阶段', 5, 'Maven 多模块与 MyBatis 入门', NOW(), NOW()),
(2, '框架阶段', 6, 'Spring IoC/AOP 核心思想与实操', NOW(), NOW()),
(2, '框架阶段', 7, 'SpringMVC 请求处理与参数绑定', NOW(), NOW()),
(2, 'Spring Boot阶段', 8, 'Spring Boot 起步、配置与自动装配', NOW(), NOW()),
(2, 'Spring Boot阶段', 9, 'Spring Boot 整合 MyBatis/Redis 与统一返回', NOW(), NOW()),
(2, 'Spring Cloud阶段', 10, 'Nacos 注册配置中心与服务调用', NOW(), NOW()),
(2, 'Spring Cloud阶段', 11, 'Gateway 网关、鉴权与限流', NOW(), NOW()),
(2, '项目阶段', 12, '后台权限管理系统需求分析与表设计', NOW(), NOW()),
(2, '项目阶段', 13, '用户角色权限模块开发与联调', NOW(), NOW()),
(2, '项目阶段', 14, '项目部署、排错与答辩准备', NOW(), NOW()),
(2, 'AI课程阶段', 15, '大模型 API 调用与 Prompt 工程入门', NOW(), NOW()),
(2, 'AI课程阶段', 16, 'RAG 检索增强与智能客服小 demo', NOW(), NOW()),
-- AI线下特训
(4, 'AI基础阶段', 1, '大模型概念、Token、温度参数与常见模型对比', NOW(), NOW()),
(4, 'AI基础阶段', 2, 'Prompt 设计原则与多轮对话技巧', NOW(), NOW()),
(4, 'AI应用阶段', 3, 'OpenAI/国产大模型 API 接入与封装', NOW(), NOW()),
(4, 'AI应用阶段', 4, 'Function Calling / Tools 调用实战', NOW(), NOW()),
(4, 'RAG阶段', 5, '文档切片、向量库与相似度检索', NOW(), NOW()),
(4, 'RAG阶段', 6, '企业知识库问答系统搭建', NOW(), NOW()),
(4, 'Agent阶段', 7, 'Agent 工作流设计与工具编排', NOW(), NOW()),
(4, '项目阶段', 8, 'AI 助手完整项目联调与演示', NOW(), NOW());

ALTER TABLE sys_course AUTO_INCREMENT = 100;
ALTER TABLE sys_course_detail AUTO_INCREMENT = 1000;