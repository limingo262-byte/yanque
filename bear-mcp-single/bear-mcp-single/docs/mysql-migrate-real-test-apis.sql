-- 将课堂 MOCK 配置切换为项目内真实可请求的 HTTP 测试接口。
-- Bear MCP 后端默认运行在 8090 端口；如果端口调整，请同步修改下面的 URL。

UPDATE mcp_request_config
SET type = 'HTTP',
    method = 'POST',
    url = 'http://127.0.0.1:8090/api/test/clock',
    headers = JSON_OBJECT('Content-Type', 'application/json'),
    body_template = '{"message":"{{message}}"}',
    params_default = JSON_OBJECT('message', '默认消息'),
    is_enabled = 1
WHERE config_key = 'demo_clock';

UPDATE mcp_request_config
SET type = 'HTTP',
    method = 'POST',
    url = 'http://127.0.0.1:8090/api/test/courses',
    headers = JSON_OBJECT('Content-Type', 'application/json'),
    body_template = '{"keyword":"{{keyword}}","page":{{page}},"pageSize":{{pageSize}}}',
    params_default = JSON_OBJECT('keyword', '', 'page', 1, 'pageSize', 10),
    is_enabled = 1
WHERE config_key = 'query_course_list';
