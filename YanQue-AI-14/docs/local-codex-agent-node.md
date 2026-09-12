# 本地 Codex Agent 节点（FRP）

这套链路让阿里云服务器通过自建 FRP 通道调用 Windows 上的 Codex Agent。Windows 只主动连接服务器，无需公网 IP、ngrok 或 SSH 反向隧道。

~~~text
飞书 -> YanQue-AI -> Redis -> 127.0.0.1:18787 -> frps
                                                   |
                                                FRP 通道
                                                   |
本地 Codex <- Agent :8787 <- frpc <----------------+
     |
     +-> HTTPS Bear MCP -> 日志、源码、数据库
~~~

## 1. 服务器启动 frps

复制仓库中的 `deploy/frp/frps.toml.example` 为 `/opt/yanque/frp/frps.toml`，替换随机 Token 后启动：

~~~bash
cd /opt/yanque/app
docker compose -f deploy/docker-compose.frps.yml up -d
~~~

`proxyBindAddr = "172.17.0.1"` 会让 Agent 映射端口只允许服务器本机访问。安全组只开放 TCP 7000，不开放 18787。

## 2. Windows 启动 Agent

本地 `.env`：

~~~ini
AGENT_NODE_HOST=127.0.0.1
AGENT_NODE_PORT=8787
AGENT_NODE_TOKEN=请替换为随机长字符串
AGENT_NODE_WORKER_ID=office-codex-01
AGENT_NODE_WORKDIR=D:/YanQue-AI
AGENT_NODE_MAX_CONCURRENCY=1
CODEX_TASK_TIMEOUT_SECONDS=300
CODEX_MODEL=gpt-5.6-sol
CODEX_REASONING_EFFORT=low
~~~

启动并验证：

~~~powershell
cd D:\YanQue-AI\YanQue-AI-14
uv sync
uv run yanque-agent-node
Invoke-RestMethod http://127.0.0.1:8787/health
~~~

## 3. Windows 启动 frpc

下载与服务器相同版本的 FRP，把 `deploy/frp/frpc.windows.toml.example` 复制到 FRP 目录并改名为 `frpc.toml`，填写服务器地址和相同的 FRP Token：

~~~powershell
.\frpc.exe -c .\frpc.toml
~~~

## 4. 切换服务器 Agent 地址

在服务器 `/opt/yanque/.env` 配置：

~~~ini
AGENT_NODE_URL=http://host.docker.internal:18787
AGENT_NODE_TOKEN=与Windows本地Agent完全相同的Token
AGENT_NODE_POLL_SECONDS=2
AGENT_NODE_TIMEOUT_SECONDS=240
~~~

重新创建 `yanque-ai` 后，从服务器验证：

~~~bash
docker exec yanque-ai python -c 'import urllib.request; print(urllib.request.urlopen("http://host.docker.internal:18787/health").read().decode())'
docker compose --profile full -f deploy/docker-compose.prod.yml up -d --force-recreate yanque-ai
~~~

## 5. 任务协议

飞书事件处理器先创建任务并回复“正在分析”。服务器向 `/api/agent/jobs` 提交任务，再轮询 `/api/agent/jobs/{task_id}`。本地 Agent 调用 Codex，Codex 通过 HTTPS 访问 Bear MCP，任务成功后服务器把结论、证据和建议回复飞书。

本地 Agent 和 Bear MCP 都必须验证各自的 Bearer Token。群聊结果应对手机号、Token、密码和支付签名脱敏。
