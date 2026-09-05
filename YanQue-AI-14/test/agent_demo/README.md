# LangChain Agent 示例

这些文件对应第九天的 Agent 课程。

运行前先确认 `.env` 里已经配置百炼模型：

```text
BAILIAN_API_KEY=你的百炼 API Key
BAILIAN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
BAILIAN_MODEL=qwen-plus
```

建议按这个顺序运行：

```text
01_create_agent_demo.py              创建 Agent，并查看它有哪些工具
02_direct_answer_demo.py             普通概念问题：直接回答
03_schedule_tool_demo.py             课程安排问题：调用课程查询工具
04_knowledge_tool_demo.py            课程实现问题：调用知识库工具
05_compare_three_questions_demo.py   对比三类问题的最终回答
06_messages_process_demo.py          打印 Agent 中间消息，看清工具调用过程
07_multi_step_tools_demo.py          多步工具调用：先查课程，再查课程详情
08_short_term_memory_demo.py         短期记忆：同一个 thread_id 会保留对话历史
09_memory_trim_demo.py               历史消息裁剪：只保留最近几条消息
10_checkpoint_trim_agent_demo.py     checkpoint 裁剪：在 Agent 运行前裁剪历史并写回状态
11_response_format_demo.py           结构化输出：兼容写法，把 Agent 回答整理成固定字段
12_middleware_hooks_demo.py          middleware 扩展点：观察 before/after hook 执行时机
13_wrap_tool_call_demo.py            工具调用拦截：用 wrap_tool_call 处理工具异常
```

运行方式：

下面的命令需要在 `YanQue-AI` 目录下执行。

```bash
uv run python -m test.agent_demo.01_create_agent_demo
```

其他练习同理，比如第 11 个练习：

```bash
uv run python -m test.agent_demo.11_response_format_demo
```
