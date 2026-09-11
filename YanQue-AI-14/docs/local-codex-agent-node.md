# 本地 Codex Agent 节点

这套链路让阿里云服务器通过 ngrok 调用本地 Codex，不要求本地程序轮询服务器。

~~~text
飞书 -> 服务器 -> Redis -> ngrok -> 本地 Agent -> codex exec -> Bear MCP
                                <- 服务器轮询任务状态并取得结果 <-
~~~

## 1. 本地准备

确认 Codex 已登录，且 Bear MCP 已在本机 Codex 配置中启用。日志分析依赖的 MCP 应设置为必需服务，避免 MCP 初始化失败后 Codex 在没有证据的情况下继续回答。

生成一个随机 Agent Token，并写入本地 .env：

~~~ini
AGENT_NODE_HOST=127.0.0.1
AGENT_NODE_PORT=8787
AGENT_NODE_TOKEN=请替换为随机长字符串
AGENT_NODE_WORKER_ID=office-codex-01
AGENT_NODE_WORKDIR=D:/YanQue-AI
AGENT_NODE_MAX_CONCURRENCY=1
CODEX_TASK_TIMEOUT_SECONDS=180
~~~

安装依赖并启动本地节点：

~~~powershell
cd D:\YanQue-AI\YanQue-AI-14
uv sync
uv run yanque-agent-node
~~~

验证本地服务：

~~~powershell
Invoke-RestMethod http://127.0.0.1:8787/health
~~~

## 2. 启动 ngrok

~~~powershell
ngrok http 8787
~~~

复制 ngrok 输出的 HTTPS Forwarding 地址，例如 https://example.ngrok-free.app。本地 Agent 只监听 127.0.0.1，公网入口由 ngrok 提供，任务接口必须携带 AGENT_NODE_TOKEN。

## 3. 服务器配置

在服务器 /opt/yanque/.env 配置：

~~~ini
ANALYSIS_GATEWAY_TOKEN=另一个随机长字符串
AGENT_NODE_URL=https://example.ngrok-free.app
AGENT_NODE_TOKEN=与本地完全相同的AgentToken
AGENT_NODE_POLL_SECONDS=2
AGENT_NODE_TIMEOUT_SECONDS=240
~~~

服务器 yanque-ai 通过 Redis 保存任务，向 ngrok 提交任务，然后由服务器轮询本地任务结果。本地电脑不查询服务器。

## 4. 创建测试任务

服务器内部或飞书 Bot 调用：

~~~http
POST /internal/analysis/tasks
Authorization: Bearer <ANALYSIS_GATEWAY_TOKEN>
Content-Type: application/json

{
  "question": "用户18477390000支付课程没有成功，请分析原因",
  "source": "feishu",
  "source_message_id": "飞书消息ID",
  "source_chat_id": "飞书会话ID",
  "requester_id": "飞书用户ID"
}
~~~

接口立即返回 202 和任务编号。随后通过 GET /internal/analysis/tasks/{task_id} 查询状态。状态从 PENDING 依次进入 DISPATCHING、RUNNING 和 SUCCESS，异常时进入 FAILED 或 TIMEOUT。

同一个 source_message_id 重复提交时返回原任务，防止飞书事件重试造成重复分析。

## 5. 飞书接入点

飞书事件处理器收到消息后创建任务，立即回复“正在分析”，任务完成后把 result 中的结论、证据、影响和建议回复原消息。

正式使用前应固定 ngrok 域名，临时免费域名重启后通常会变化。群聊结果必须对手机号、Token、密码和支付签名脱敏。
