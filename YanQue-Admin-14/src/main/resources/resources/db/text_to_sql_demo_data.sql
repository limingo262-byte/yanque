-- YanQue Text-to-SQL 本地个人数据库演示数据。
-- 仅用于 Admin 页面联调；不删除、不修改既有业务数据。
-- 可重复执行：conversation_id、问题文本和任务名称均做了去重。

USE yanque;

INSERT INTO ai_text_to_sql_run
    (conversation_id, source_type, original_question, status,
     state_snapshot_json, state_history_json, duration_ms, created_by)
SELECT 'codex-mcp-local-20260904-001', 'CHAT',
       '查询最近一个月的订单数量和支付金额', 'SUCCESS',
       '{"intent_result":{"business_domain":"order","intent":"metric_query"},"selected_tables":["order_payment"],"sql_generation_result":{"action":"SELECT","sql":"SELECT COUNT(*) AS order_count, SUM(pay_amount) AS paid_amount FROM order_payment WHERE pay_time >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)"},"executed_sql":"SELECT COUNT(*) AS order_count, SUM(pay_amount) AS paid_amount FROM order_payment WHERE pay_time >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)","answer":"最近一个月订单数量和支付金额查询成功。"}',
       '[{"node":"intent_recognition","status":"SUCCESS"},{"node":"resource_read","status":"SUCCESS"},{"node":"sql_generation","status":"SUCCESS"},{"node":"query_data_source","status":"SUCCESS"}]',
       842, 1
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_run WHERE conversation_id = 'codex-mcp-local-20260904-001');

INSERT INTO ai_text_to_sql_run
    (conversation_id, source_type, original_question, status,
     state_snapshot_json, state_history_json, duration_ms, created_by)
SELECT 'codex-mcp-local-20260904-002', 'CHAT',
       '查询每个班级的学生人数，按人数从高到低排列', 'SUCCESS',
       '{"intent_result":{"business_domain":"student","intent":"group_query"},"selected_tables":["student","clazz"],"sql_generation_result":{"action":"SELECT","sql":"SELECT c.name AS class_name, COUNT(s.id) AS student_count FROM clazz c LEFT JOIN student s ON s.class_id = c.id GROUP BY c.id, c.name ORDER BY student_count DESC LIMIT 100"},"executed_sql":"SELECT c.name AS class_name, COUNT(s.id) AS student_count FROM clazz c LEFT JOIN student s ON s.class_id = c.id GROUP BY c.id, c.name ORDER BY student_count DESC LIMIT 100","answer":"已按班级统计学生人数并降序排列。"}',
       '[{"node":"intent_recognition","status":"SUCCESS"},{"node":"business_resource","status":"SUCCESS"},{"node":"schema_resource","status":"SUCCESS"},{"node":"query_data_source","status":"SUCCESS"}]',
       1164, 1
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_run WHERE conversation_id = 'codex-mcp-local-20260904-002');

INSERT INTO ai_text_to_sql_eval_question
    (question, business_domain, eval_target, sample_category, source_type,
     judge_note, remark, status, created_by)
SELECT '查询最近一个月的订单数量和支付金额', 'order', 'END_TO_END', 'NORMAL', 'MANUAL',
       '验证订单域路由、指标口径读取、只读 SQL 生成和查询结果回答。',
       '本地个人数据库联调样本', 'ACTIVE', 1
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_question WHERE question = '查询最近一个月的订单数量和支付金额');

INSERT INTO ai_text_to_sql_eval_question
    (question, business_domain, eval_target, sample_category, source_type,
     judge_note, remark, status, created_by)
SELECT '查询每个班级的学生人数，按人数从高到低排列', 'student', 'END_TO_END', 'NORMAL', 'MANUAL',
       '验证学生域表关联、分组统计、排序和明细结果行数限制。',
       '本地个人数据库联调样本', 'ACTIVE', 1
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_question WHERE question = '查询每个班级的学生人数，按人数从高到低排列');

INSERT INTO ai_text_to_sql_eval_question
    (question, business_domain, eval_target, sample_category, source_type,
     judge_note, remark, status, created_by)
SELECT '查询订单数量', 'order', 'CLARIFICATION', 'AMBIGUOUS', 'MANUAL',
       '验证缺少时间范围和统计口径时是否先澄清。',
       '边界场景：不应直接执行无范围查询', 'ACTIVE', 1
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_question WHERE question = '查询订单数量');

SET @q_order = (SELECT id FROM ai_text_to_sql_eval_question WHERE question = '查询最近一个月的订单数量和支付金额' LIMIT 1);
SET @q_student = (SELECT id FROM ai_text_to_sql_eval_question WHERE question = '查询每个班级的学生人数，按人数从高到低排列' LIMIT 1);
SET @q_ambiguous = (SELECT id FROM ai_text_to_sql_eval_question WHERE question = '查询订单数量' LIMIT 1);

INSERT INTO ai_text_to_sql_eval_assertion
    (eval_question_id, actual_key, operator, expected_value, required, weight, failure_type, sort_order, remark)
SELECT @q_order, 'intent_result.business_domain', 'EQ', 'order', 1, 1, 'INTENT_ERROR', 10, '业务域必须路由到 order'
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_assertion WHERE eval_question_id = @q_order AND actual_key = 'intent_result.business_domain');
INSERT INTO ai_text_to_sql_eval_assertion
    (eval_question_id, actual_key, operator, expected_value, required, weight, failure_type, sort_order, remark)
SELECT @q_order, 'executed_sql', 'NOT_EMPTY', NULL, 1, 1, 'SQL_GENERATION_ERROR', 20, '必须产生可执行 SQL'
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_assertion WHERE eval_question_id = @q_order AND actual_key = 'executed_sql');

INSERT INTO ai_text_to_sql_eval_assertion
    (eval_question_id, actual_key, operator, expected_value, required, weight, failure_type, sort_order, remark)
SELECT @q_student, 'intent_result.business_domain', 'EQ', 'student', 1, 1, 'INTENT_ERROR', 10, '业务域必须路由到 student'
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_assertion WHERE eval_question_id = @q_student AND actual_key = 'intent_result.business_domain');
INSERT INTO ai_text_to_sql_eval_assertion
    (eval_question_id, actual_key, operator, expected_value, required, weight, failure_type, sort_order, remark)
SELECT @q_student, 'selected_tables', 'CONTAINS', 'student', 1, 1, 'TABLE_SELECTION_ERROR', 20, '必须使用 student 表'
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_assertion WHERE eval_question_id = @q_student AND actual_key = 'selected_tables');
INSERT INTO ai_text_to_sql_eval_assertion
    (eval_question_id, actual_key, operator, expected_value, required, weight, failure_type, sort_order, remark)
SELECT @q_student, 'executed_sql', 'NOT_EMPTY', NULL, 1, 1, 'SQL_GENERATION_ERROR', 30, '必须产生可执行 SQL'
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_assertion WHERE eval_question_id = @q_student AND actual_key = 'executed_sql');

INSERT INTO ai_text_to_sql_eval_assertion
    (eval_question_id, actual_key, operator, expected_value, required, weight, failure_type, sort_order, remark)
SELECT @q_ambiguous, 'answer', 'NOT_EMPTY', NULL, 1, 1, 'CLARIFICATION_ERROR', 10, '歧义问题必须返回澄清或明确说明'
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_assertion WHERE eval_question_id = @q_ambiguous AND actual_key = 'answer');

SET @run_order = (SELECT id FROM ai_text_to_sql_run WHERE conversation_id = 'codex-mcp-local-20260904-001' LIMIT 1);
SET @run_student = (SELECT id FROM ai_text_to_sql_run WHERE conversation_id = 'codex-mcp-local-20260904-002' LIMIT 1);

INSERT INTO ai_text_to_sql_eval_task
    (name, business_domain, eval_target, sample_category, status, total_count, pass_count, fail_count,
     interrupted_count, pass_rate, started_at, finished_at, duration_ms, created_by)
SELECT '本地个人数据库 Text-to-SQL 回归演示', NULL, 'END_TO_END', NULL, 'SUCCESS', 2, 2, 0,
       0, 1.0000, NOW() - INTERVAL 3 SECOND, NOW(), 2006, 1
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_task WHERE name = '本地个人数据库 Text-to-SQL 回归演示');
SET @task_id = (SELECT id FROM ai_text_to_sql_eval_task WHERE name = '本地个人数据库 Text-to-SQL 回归演示' LIMIT 1);

INSERT INTO ai_text_to_sql_eval_result
    (eval_task_id, eval_question_id, run_record_id, question, result_status, passed, score,
     state_snapshot_json, state_history_json, duration_ms)
SELECT @task_id, @q_order, @run_order, '查询最近一个月的订单数量和支付金额', 'SUCCESS', 1, 1.0000,
       (SELECT state_snapshot_json FROM ai_text_to_sql_run WHERE id = @run_order),
       (SELECT state_history_json FROM ai_text_to_sql_run WHERE id = @run_order), 842
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_result WHERE eval_task_id = @task_id AND eval_question_id = @q_order);
INSERT INTO ai_text_to_sql_eval_result
    (eval_task_id, eval_question_id, run_record_id, question, result_status, passed, score,
     state_snapshot_json, state_history_json, duration_ms)
SELECT @task_id, @q_student, @run_student, '查询每个班级的学生人数，按人数从高到低排列', 'SUCCESS', 1, 1.0000,
       (SELECT state_snapshot_json FROM ai_text_to_sql_run WHERE id = @run_student),
       (SELECT state_history_json FROM ai_text_to_sql_run WHERE id = @run_student), 1164
WHERE NOT EXISTS (SELECT 1 FROM ai_text_to_sql_eval_result WHERE eval_task_id = @task_id AND eval_question_id = @q_student);

UPDATE ai_text_to_sql_eval_question SET status = 'ACTIVE' WHERE id IN (@q_order, @q_student, @q_ambiguous);
