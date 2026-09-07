-- Restore Text-to-SQL resources without external TOS credentials.
-- The MCP image already contains these files under classpath:text-to-sql/.
INSERT INTO mcp_resource
    (resource_uri, name, description, mime_type, object_key, file_name, creator_id, is_enabled, publish_status)
VALUES
    ('bear://yanque/text-to-sql/business/student', 'YanQue student business rules', 'Student business terminology and query rules', 'text/markdown', 'local://business-student.md', 'business-student.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/business/order', 'YanQue order business rules', 'Payment order business terminology and query rules', 'text/markdown', 'local://business-order.md', 'business-order.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/metrics/student', 'YanQue student metrics', 'Student metric definitions', 'text/markdown', 'local://metrics-student.md', 'metrics-student.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/metrics/order', 'YanQue order metrics', 'Payment order metric definitions', 'text/markdown', 'local://metrics-order.md', 'metrics-order.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/schema/student', 'student schema', 'Personal student table schema', 'text/markdown', 'local://ddl-student.md', 'ddl-student.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/schema/sys_class', 'sys_class schema', 'Personal class table schema', 'text/markdown', 'local://ddl-sys_class.md', 'ddl-sys_class.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/schema/order_payment', 'order_payment schema', 'Personal payment order table schema', 'text/markdown', 'local://ddl-order_payment.md', 'ddl-order_payment.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/ddl/student', 'student DDL', 'Student table DDL compatibility resource', 'text/markdown', 'local://ddl-student.md', 'ddl-student.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/ddl/sys_class', 'sys_class DDL', 'Class table DDL compatibility resource', 'text/markdown', 'local://ddl-sys_class.md', 'ddl-sys_class.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/ddl/order_payment', 'order_payment DDL', 'Payment order DDL compatibility resource', 'text/markdown', 'local://ddl-order_payment.md', 'ddl-order_payment.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/table-catalog', 'YanQue personal table catalog', 'Tables available in the personal YanQue database', 'text/markdown', 'local://table-catalog.md', 'table-catalog.md', 10001, 1, 2),
    ('bear://yanque/text-to-sql/agent', 'YanQue Text-to-SQL agent guide', 'Text-to-SQL agent workflow and safety rules', 'text/markdown', 'local://agent.md', 'agent.md', 10001, 1, 2)
ON DUPLICATE KEY UPDATE
    name = VALUES(name), description = VALUES(description), mime_type = VALUES(mime_type),
    object_key = VALUES(object_key), file_name = VALUES(file_name), creator_id = VALUES(creator_id),
    is_enabled = 1, publish_status = 2;

INSERT IGNORE INTO mcp_role_resource (role_code, resource_uri)
SELECT 'ADMIN', resource_uri
FROM mcp_resource
WHERE resource_uri LIKE 'bear://yanque/text-to-sql/%' AND is_enabled = 1 AND publish_status IN (1, 2);

DELETE FROM mcp_user_resource_selection
WHERE token_id = 1 AND resource_uri LIKE 'bear://yanque/text-to-sql/%';

INSERT INTO mcp_user_resource_selection (token_id, resource_uri, is_enabled)
SELECT 1, resource_uri, 1
FROM mcp_role_resource
WHERE role_code = 'ADMIN' AND resource_uri LIKE 'bear://yanque/text-to-sql/%';
