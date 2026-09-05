-- YanQue Text-to-SQL 本地联调配置。
-- Resource 正文使用 Bear classpath 的 local:// 读取，不依赖外部 TOS 上传。

USE `bear-mcp-single`;

UPDATE mcp_resource SET object_key='local://agent.md', file_name='agent.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/agent';
UPDATE mcp_resource SET object_key='local://agent-datasource.md', file_name='agent-datasource.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/agent/datasource';
UPDATE mcp_resource SET object_key='local://agent-security.md', file_name='agent-security.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/agent/security';
UPDATE mcp_resource SET object_key='local://agent-evaluation.md', file_name='agent-evaluation.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/agent/evaluation';
UPDATE mcp_resource SET object_key='local://business-order.md', file_name='business-order.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/business/order';
UPDATE mcp_resource SET object_key='local://business-student.md', file_name='business-student.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/business/student';
UPDATE mcp_resource SET object_key='local://metrics-order.md', file_name='metrics-order.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/metrics/order';
UPDATE mcp_resource SET object_key='local://metrics-student.md', file_name='metrics-student.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/metrics/student';
UPDATE mcp_resource SET object_key='local://table-catalog.md', file_name='table-catalog.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/table-catalog';
UPDATE mcp_resource SET object_key='local://ddl-order_payment.md', file_name='ddl-order_payment.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/ddl/order_payment';
UPDATE mcp_resource SET object_key='local://ddl-student.md', file_name='ddl-student.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/ddl/student';
UPDATE mcp_resource SET object_key='local://ddl-sys_class.md', file_name='ddl-sys_class.md', is_enabled=1, publish_status=2
 WHERE resource_uri='bear://yanque/text-to-sql/ddl/sys_class';

INSERT IGNORE INTO mcp_prompt_template
    (prompt_name,title,description,arguments_schema,template_content,linked_tool_names,creator_id,is_enabled,publish_status)
VALUES
    ('yanque_text_to_sql','YanQue Text-to-SQL','个人业务数据库自然语言查询 Prompt',
     '[{"name":"question","description":"用户自然语言问题","required":true},{"name":"datasource_id","description":"数据源 ID","required":true},{"name":"max_rows","description":"最大返回行数","required":false},{"name":"execute_sql","description":"是否执行 SQL","required":false}]',
     '你是 YanQue Text-to-SQL Agent。问题：{{question}}\n数据源：{{datasource_id}}\n最大行数：{{max_rows}}\n是否执行：{{execute_sql}}\n先读取 business、metrics、table-catalog 和 DDL Resource，只生成单条安全 SELECT；确认后调用 query_data_source，并返回 SQL、口径、结果和结论。',
     '["list_data_sources","list_mcp_resources","read_mcp_resource","query_data_source"]',10001,1,2);

INSERT IGNORE INTO mcp_role_prompt (role_code,prompt_name) VALUES ('ADMIN','yanque_text_to_sql');
INSERT IGNORE INTO mcp_user_prompt_selection (token_id,prompt_name,is_enabled) VALUES (1,'yanque_text_to_sql',1);
INSERT IGNORE INTO mcp_role_resource (role_code,resource_uri) VALUES
('ADMIN','bear://yanque/text-to-sql/agent'),('ADMIN','bear://yanque/text-to-sql/agent/datasource'),
('ADMIN','bear://yanque/text-to-sql/agent/security'),('ADMIN','bear://yanque/text-to-sql/agent/evaluation'),
('ADMIN','bear://yanque/text-to-sql/business/order'),('ADMIN','bear://yanque/text-to-sql/business/student'),
('ADMIN','bear://yanque/text-to-sql/metrics/order'),('ADMIN','bear://yanque/text-to-sql/metrics/student'),
('ADMIN','bear://yanque/text-to-sql/table-catalog'),('ADMIN','bear://yanque/text-to-sql/ddl/order_payment'),
('ADMIN','bear://yanque/text-to-sql/ddl/student'),('ADMIN','bear://yanque/text-to-sql/ddl/sys_class');
INSERT IGNORE INTO mcp_user_resource_selection (token_id,resource_uri,is_enabled)
SELECT 1,resource_uri,1 FROM mcp_role_resource WHERE role_code='ADMIN' AND resource_uri LIKE 'bear://yanque/text-to-sql/%';
INSERT IGNORE INTO mcp_user_tool_selection (token_id,tool_name,tool_type,is_enabled) VALUES
(1,'list_mcp_resources','BUILTIN',1),(1,'read_mcp_resource','BUILTIN',1),
(1,'list_mcp_prompts','BUILTIN',1),(1,'render_prompt','BUILTIN',1),
(1,'list_data_sources','BUILTIN',1),(1,'query_data_source','BUILTIN',1),
(1,'get_skill','BUILTIN',1);

UPDATE mcp_skill SET object_key='local://yanque-text-to-sql/SKILL.md', file_name='SKILL.md',
    file_size=2048, is_enabled=1, publish_status=2
 WHERE skill_code='SKILL0000000001';
