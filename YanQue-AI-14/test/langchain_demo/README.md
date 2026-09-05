# LangChain 课堂演示脚本

这些脚本对应第七天讲义里的核心示例。演示模型使用 `ChatOpenAI`，并通过 `.env` 读取百炼兼容接口配置。

运行前先确认 `.env` 里已经配置：

```text
DASHSCOPE_API_KEY=你的百炼 API Key
BAILIAN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
BAILIAN_MODEL=qwen3.7-plus
```

运行方式：

```bash
uv run python test/langchain_demo/02_invoke_demo.py
```

建议课堂顺序：

```text
01_create_model_demo.py              创建模型对象
02_invoke_demo.py                    invoke 普通调用
03_invoke_messages_demo.py           invoke 传入 messages
04_stream_demo.py                    stream 流式输出
05_batch_demo.py                     batch 批量调用
06_prompt_template_demo.py           ChatPromptTemplate
07_prompt_model_chain_demo.py        Prompt | Model
08_stream_prompt_model_chain_demo.py Prompt | Model 流式输出
09_output_parser_demo.py             Output Parser：Str/Json/List/Pydantic/格式修复思路
10_lcel_demo.py                      LCEL 链式写法
11_runnable_lambda_demo.py           RunnableLambda
12_runnable_passthrough_demo.py      RunnablePassthrough
13_runnable_parallel_demo.py         RunnableParallel
14_history_messages_demo.py          历史消息接入
15_rag_chain_demo.py                 RAG Chain
16_tool_api_demo.py                  Tool API
17_few_shot_prompt_demo.py           扩展：FewShotChatMessagePromptTemplate
18_structured_prompt_demo.py         扩展：StructuredPrompt
```

`17` 和 `18` 属于扩展了解。第七天主线先讲清楚 `ChatPromptTemplate`、`MessagesPlaceholder` 和链式写法即可。

其中 `01`、`02`、`03`、`04`、`05`、`07`、`08`、`10`、`11`、`15` 会真实调用模型，需要提前配置 API Key。

`16_tool_api_demo.py` 和 `18_structured_prompt_demo.py` 默认只演示本地结构；如果要继续真实调用模型，可以设置：

```bash
export LANGCHAIN_DEMO_CALL_MODEL=true
```
