# MCP Demo

这个目录只保留一条课堂主线：

```text
MCP Server
  -> MCP Client 调用它
  -> LangChain 加载 MCP Tools
  -> LangChain Agent 使用 MCP Tools
```

## 文件说明

```text
01_course_mcp_server.py         定义一个课程 MCP Server
02_call_mcp_server.py           用普通 MCP Client 调用这个 Server
03_langchain_load_mcp_tools.py  用 LangChain 加载 MCP Server 里的工具
04_agent_use_mcp_tools.py       让 LangChain Agent 使用 MCP 工具回答问题
```

## 运行顺序

进入 `YanQue-AI` 目录：

```bash
cd /Users/huangjin/IdeaProjects/YanQue14/YanQue-AI
```

第一步：启动 streamable-http MCP Server。

```bash
uv run python test/mcp_demo/01_course_mcp_server.py
```

它会监听：

```text
http://127.0.0.1:8010/mcp
```

这个命令会一直运行，不要关掉。

第二步：打开另一个终端，用 MCP Client 调 MCP Server。

```bash
uv run python test/mcp_demo/02_call_mcp_server.py
```

第三步：用 LangChain 通过 streamable-http 加载 MCP Tools、Resources、Prompts。

```bash
uv run python test/mcp_demo/03_langchain_load_mcp_tools.py
```

第四步：让 LangChain Agent 使用 MCP Tools，同时读取 MCP Resource 和 Prompt。

```bash
uv run python test/mcp_demo/04_agent_use_mcp_tools.py
```

`04_agent_use_mcp_tools.py` 需要 `.env` 里已经配置好模型参数。

## 课堂重点

- MCP Server 负责把工具暴露出来。
- MCP Client 负责连接 MCP Server 并调用工具。
- `langchain-mcp-adapters` 负责通过 streamable-http 连接 MCP Server。
- LangChain 可以从 MCP Server 读取 Tool、Resource 和 Prompt。
- LangChain Agent 拿到这些 Tool 后，就可以自己判断什么时候调用工具。
