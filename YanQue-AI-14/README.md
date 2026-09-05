# YanQue-AI

燕雀学生端 AI 问答的 **AI 服务层**，对应课件《学生端 AI 问答整体设计方案》里的 Python 这一层。

```text
学生端前端  →  Java 业务后端  →  YanQue-AI（本服务）  →  百炼 / 通义千问
```

这一层的边界：

- **只管"怎么答"**：组装提示词、调用模型、处理流式、返回文本和用量
- **不管"能不能问"**：身份鉴权、会话管理、消息入库、限流都在 Java 侧
- **无状态**：不查业务库、不认学生身份，上下文全部由 Java 在请求里带过来
- **模型 Key 不出本服务**

## 一、准备配置

```bash
cp .env.example .env
# 编辑 .env，填入百炼 API Key
```

必填一项：

```ini
DASHSCOPE_API_KEY=sk-xxxxxxxx
BAILIAN_MODEL=qwen3.7-plus
```

> 模型 ID 以百炼控制台「模型广场」显示的为准。换模型只改 `.env`，代码一行不用动。

## 二、启动

```bash
uv sync
uv run python -m yanque_ai.main
```

启动后：

- 健康检查 <http://localhost:8000/health>
- 接口文档 <http://localhost:8000/docs>

## 三、接口

| 接口 | 说明 |
| --- | --- |
| `GET /health` | 健康检查，同时返回当前模型 |
| `POST /ai/chat/stream` | 通用问答，SSE 流式返回 |

### 3.1 流式（SSE）

```bash
curl -N http://localhost:8000/ai/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"question": "用一句话介绍你自己"}'
```

三种事件：

```text
event: delta
data: {"content": "列"}

event: done
data: {"model": "qwen3.7-plus", "finish_reason": "stop", "truncated": false,
       "usage": {"prompt_tokens": 21, "completion_tokens": 30, "total_tokens": 51}}

event: error
data: {"code": "UPSTREAM_TIMEOUT", "message": "模型调用超时，请稍后重试"}
```

Java 侧在这条链路上是**转发方**：收到 `delta` 立刻推给前端，同时追加到内存缓冲；
收到 `done` 再把缓冲里的整段回答一次性写进消息表。
`error` 事件表示流中途失败——user 消息此前已经落库，前端可以直接重试，不用重新输入。

> 流式一旦开始推送，HTTP 状态码就改不了了，所以错误只能用 `error` 事件传，不能靠状态码。

### 3.2 请求参数

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `question` | 是 | 学生本次的提问 |
| `history` | 否 | 历史消息，按时间正序，**不含**本次提问 |
| `summary` | 否 | 历史对话摘要，对应会话表的 `summary` |
`history` 只传 `compressed = 0` 的原文消息，已压缩的旧对话通过 `summary` 传进来——
对应课件 3.2 节的「水位线管写、标记位管读」。

### 3.3 错误码

| HTTP | code | 含义 |
| --- | --- | --- |
| 422 | — | 参数校验不通过（FastAPI 自动返回） |
| 429 | `UPSTREAM_RATE_LIMITED` | 上游限流，稍后重试 |
| 500 | `CONFIG_MISSING` | 没配 API Key 等必需配置 |
| 502 | `UPSTREAM_UNAUTHORIZED` | API Key 无效或无权限 |
| 502 | `UPSTREAM_ERROR` | 模型返回错误或网络不通 |
| 504 | `UPSTREAM_TIMEOUT` | 模型调用超时 |

网络错误、429、5xx 会在本服务内自动重试（`BAILIAN_MAX_RETRIES`，默认 2 次指数退避），
**Java 侧不要再重试**，否则重试次数会相乘。

## 四、本地验证

不启动 Java、也不走 HTTP，直接在命令行和模型对话：

```bash
uv run python test/chat_cli.py             # 流式
uv run python test/chat_cli.py --no-stream # 非流式
```

输入 `clear` 清空上下文，`exit` 退出。
这个脚本会把每轮问答都追加进 `history` 再发回给模型——多轮对话的本质就是**每次把前面的对话重新发一遍**。

只想验证 Key 和模型 ID 通不通，用更底层的原始 HTTP 脚本：

```bash
uv run python test/test_bailian_chat.py
```

练习 Milvus 的 CRUD、metadata 过滤和向量检索：

```bash
uv run python test/milvus_crud_demo.py
```

想练哪一步，就在 `test/milvus_crud_demo.py` 的 `main()` 里取消对应代码注释。

## 五、目录结构

```text
src/yanque_ai/
├── main.py                          服务启动入口
├── common/
│   ├── application.py               FastAPI 应用组装、全局异常处理
│   ├── config.py                    环境配置，API Key 只在这里读
│   ├── errors.py                    统一异常
│   └── schemas.py                   通用数据模型
├── integrations/
│   └── bailian/client.py            百炼客户端（OpenAI 兼容）
└── modules/
    ├── chat/
    │   ├── router.py                /ai/chat/stream 与 /ai/chat/summary
    │   ├── service.py               问答编排
    │   ├── schemas.py               聊天模块出入参
    │   └── prompts.py               聊天提示词组装
    └── health/router.py             /health
```

## 六、配置项

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DASHSCOPE_API_KEY` | 无，必填 | 百炼 API Key |
| `BAILIAN_MODEL` | `qwen3.7-plus` | 模型 ID |
| `BAILIAN_BASE_URL` | 百炼公共入口 | 接入地址 |
| `BAILIAN_WORKSPACE_ID` | 无 | 配了就用业务空间专属域名 |
| `BAILIAN_TEMPERATURE` | `0.7` | 随机性 |
| `BAILIAN_MAX_TOKENS` | 不限 | 单次回答长度上限 |
| `BAILIAN_TIMEOUT_SECONDS` | `60` | 调用超时 |
| `BAILIAN_MAX_RETRIES` | `2` | 失败重试次数 |
| `BAILIAN_MAX_HISTORY_MESSAGES` | `20` | 兜底截断，最多带多少条历史原文 |
| `YANQUE_ADMIN_BASE_URL` | `http://localhost:8080` | Java 管理端地址，读取数据库提示词 |
| `PROMPT_QUERY_TIMEOUT_SECONDS` | `5` | 查询 Java 提示词接口超时秒数 |

## 七、还没做的

按课件 §6，这些边界第一版不做，但架构里已经留好位置：

| 能力 | 该放在哪 |
| --- | --- |
| 限流、成本兜底 | Java 入口层（本服务不认学生身份，做不了按人限流） |
| 知识库检索（RAG） | 本服务，在组装提示词之前插入检索结果 |
| 工具调用 / Function Calling | 本服务，在 `clients/bailian.py` 之上加一层编排 |
| 上下文摘要压缩 | Java 生成并写入会话表，通过 `summary` 字段传进来 |
