# Text-to-SQL 端到端运行测试记录

- 测试日期：2026-08-31
- 测试范围：验证现有代码生成 SQL，不执行 SQL，不验证 `rows` 和 `answer`
- 请求接口：`POST http://localhost:8000/ai/text-to-sql/query`
- 总体结论：**未通过端到端 SQL 生成验收**。意图分支测试通过；数据查询进入并行检索阶段后返回 HTTP 500，未生成 SQL。

## 1. 工程职责与运行地址

| 工程 | 职责 | 启动命令（项目已有方式） | 实际访问地址 | 验证结果 |
|---|---|---|---|---|
| `bear-mcp-single/bear-mcp-single` | Bear MCP 后端，提供 MCP Resource | `mvn spring-boot:run` | `http://localhost:8090/mcp` | 服务可达；无 Token GET 返回 401；带配置 Token 的 MCP initialize 成功，但 Resource list/read 返回 500 |
| `YanQue-Admin-14` | Java 管理后端，提供提示词内部接口 | `mvn spring-boot:run` | `http://localhost:8080` | 服务可达；根路径 404；3 个 Text-to-SQL 提示词接口均成功 |
| `YanQue-AI-14` | Python FastAPI、LangGraph、检索与 SQL 生成 | `.\start-ai.bat`（内部执行 `uv run yanque-ai`） | `http://localhost:8000` | `/health`、`/docs`、`/openapi.json` 均为 200 |
| `YanQue-Admin-Web-14` | React 管理前端 | `npm.cmd run dev` | `http://localhost:5173` | 200，页面标题 `YanQue Admin` |
| `bear-mcp-single/bear-mcp-single/admin-web` | Bear MCP Vue 管理前端 | `npm.cmd run dev` | `http://localhost:5174` | 200，Vite 页面正常返回；源码默认 5173，因端口占用自动使用 5174 |

## 2. 配置核对

| 配置项 | 实际结果 |
|---|---|
| `DASHSCOPE_API_KEY` | `.env` 已配置，仅验证存在，未回显密钥 |
| `YANQUE_ADMIN_BASE_URL` | `.env` 未覆盖，代码默认 `http://localhost:8080` |
| `BEAR_MCP_URL` | `.env` 未覆盖，代码默认 `http://localhost:8090/mcp` |
| `BEAR_MCP_TOKEN` | `.env` 未覆盖，代码默认 `mcp_dev_token` |
| `MILVUS_URI` | `.env` 未覆盖，实际默认 `http://124.223.194.220:19530` |
| `MILVUS_DB_NAME` | `.env` 未覆盖，默认 `default` |
| 指标 Collection | 默认 `text_to_sql_metrics` |

Java 提示词验证：

| Prompt Code | HTTP | 业务码 | 内容 | 版本 |
|---|---:|---:|---|---:|
| `text_to_sql_intent_system` | 200 | 200 | 非空 | 1 |
| `text_to_sql_select_tables_system` | 200 | 200 | 非空 | 1 |
| `text_to_sql_generate_sql_system` | 200 | 200 | 非空 | 1 |

## 3. Graph 静态核对

现有代码链路与计划一致：

```text
START
  -> recognize_intent
  -> query_planning_pending
  -> [retrieve_metrics || retrieve_business_context || retrieve_table_catalog]
  -> context_ready_pending
  -> select_tables
  -> table_selected_pending
  -> retrieve_table_ddl
  -> ddl_ready_pending
  -> generate_sql
  -> sql_generated_pending
  -> END
```

普通聊天、写操作、范围外和歧义问题分别进入独立终点。各 pending 节点会检查 `error_message`，但只有异常已经被节点捕获并写入 State 时才有效。

## 4. 基础健康检查

| 检查项 | HTTP | 结果 |
|---|---:|---|
| `http://localhost:8000/health` | 200 | 通过 |
| `http://localhost:8000/docs` | 200 | 通过 |
| `http://localhost:8000/openapi.json` | 200 | 通过 |
| `http://localhost:8080` | 404 | 端口和 Java 服务可达，根路径无路由 |
| `http://localhost:8090/mcp`（无 Token GET） | 401 | 端口和 Bear MCP 鉴权层可达 |
| `http://localhost:5173` | 200 | YanQue Admin 前端通过 |
| `http://localhost:5174` | 200 | Bear MCP 管理前端通过 |

## 5. Text-to-SQL 接口测试

统一请求契约包含：

```json
{
  "question": "...",
  "user_id": "u1",
  "roles": ["ADMIN"]
}
```

### 5.1 正向测试

问题：`昨天订单量是多少`

实际结果：

| 字段 | 实际值 |
|---|---|
| HTTP | `500 Internal Server Error` |
| `intent` | 无结构化响应 |
| `business_domain` | 无结构化响应 |
| `metric_hits` | 无结构化响应 |
| `business_context` | 无结构化响应 |
| `table_catalog_context` | 无结构化响应 |
| `selected_tables` | 无结构化响应 |
| `table_ddl_context` | 无结构化响应 |
| `sql` | 未生成 |
| `error_message` | 无结构化响应，响应体仅 `Internal Server Error` |

结论：失败，未达到“完整生成 SQL”的验收标准。

### 5.2 分支测试

| 用例 | HTTP | `intent` | `action` | SQL | 结果 |
|---|---:|---|---|---|---|
| `你好，请介绍一下你自己` | 200 | `GENERAL_CHAT` | `ROUTE_GENERAL_CHAT` | 空 | 通过，未生成 SQL |
| `删除昨天所有订单` | 200 | `DATA_OPERATION` | `REJECT_OPERATION` | 空 | 通过，明确拒绝写操作 |
| `帮我查一下` | 200 | `AMBIGUOUS` | `ASK_CLARIFICATION` | 空 | 通过，返回澄清提示 |
| `明天上海天气怎么样` | 200 | `OUT_OF_SCOPE` | `EXPLAIN_SCOPE` | 空 | 通过，返回范围说明 |

## 6. 外部依赖专项验证

### Bear MCP

- 使用 Python 当前配置的 Token 可以完成 MCP initialize，服务返回 session id。
- 随后的 `resources/list` 返回 HTTP 500。
- 读取 `bear://yanque/text-to-sql/business/order` 返回 HTTP 500。
- 因 Resource list 已失败，无法确认业务说明、表目录和 DDL Resource 的发布、启用与 Token 授权状态。
- Bear 管理 API 未登录请求返回 HTTP 200、业务码 401，符合其业务响应封装方式。

定位层级：**Bear MCP Resource 服务端 / Resource 数据或授权配置层**。

### Milvus

- 当前配置使用默认远程地址 `http://124.223.194.220:19530`、数据库 `default`、Collection `text_to_sql_metrics`。
- 直接指标检索失败，异常为 `MilvusException: Fail connecting to server`，上层转换为 `RuntimeError: Milvus 连接失败`。
- 本次执行环境存在不可用代理 `127.0.0.1:9`，直接诊断进程的外网连接被该代理拒绝；因此不能仅凭该直测断言远程 Milvus 服务自身宕机。
- 但正向 API 同样在并行检索后 500，且 `retrieve_metrics` 没有任何异常捕获，Milvus/Embedding 连接异常能够直接造成该现象。

定位层级：**Python 指标检索节点 / Milvus 或 Embedding 外部连接层**。

### LLM 与 LangSmith

- 已启动 Python 服务能够正确完成 4 个分支的意图识别，说明该进程中的意图 LLM 实际可用。
- 单独诊断进程受 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 指向 `127.0.0.1:9` 影响，百炼与 LangSmith 连接失败；该结果不能覆盖已启动进程的环境。

## 7. 代码级失败原因

当前“依赖不可用时不崩溃”的目标未实现：

1. `retrieve_metrics` 直接调用 Milvus，没有 `try/except`，任意 Milvus、Embedding 或召回异常都会逃出 graph。
2. Bear 业务和表目录节点只捕获 `BusinessContextError` / `TableCatalogError`，但 MCP 客户端的 HTTP 500 实际抛出 `ExceptionGroup` / `HTTPStatusError`，检索器没有将其包装为领域异常，因此同样会逃出 graph。
3. 异常逃出后，pending 节点和 `stop_with_error` 没有机会执行，FastAPI 最终返回无结构化内容的 500。
4. 三路并行节点若将来同时写 `error_message`，还需要定义明确的 State reducer 或改为各分支独立错误字段，避免 LangGraph 并行写冲突。

## 8. 验收结论与建议顺序

本轮已确认：5 个服务/页面可达、Java 提示词正常、接口契约有效、4 个非数据查询分支正确。端到端数据查询未通过，阻塞发生在 `recognize_intent` 之后、`select_tables` 之前的并行检索阶段。

建议按以下顺序处理后复测：

1. 查看 Bear MCP 后端日志中 `resources/list` 的 500 堆栈，确认 Resource 数据、文件存储、发布启用状态和 `mcp_dev_token` 授权。
2. 在 Python 实际启动终端确认代理环境，并验证其能连接 Milvus、百炼 Embedding 与 rerank。
3. 确认 `text_to_sql_metrics` Collection 存在且有可召回数据。
4. 补齐三个并行检索节点的统一异常收敛，并为并行错误定义不会冲突的 State 合并方式。
5. 重启 Python 后再次执行正向请求，验收 `metric_hits`、三类上下文、`selected_tables`、`sql` 和空 `error_message`。

本轮未修改业务代码或配置，未停止任何现有服务。
