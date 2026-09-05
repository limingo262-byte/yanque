# LangGraph 课堂演示脚本

这些文件对应第九天的 LangGraph 基础课程。

这组示例先不调用真实大模型，也不绑定具体业务。

它们都是普通练习，用来一步一步理解 LangGraph 到底在做什么。

这样学生可以先看清楚：

- State 怎么保存流程里的数据；
- Node 怎么表示一个处理步骤；
- Edge 怎么连接步骤；
- Conditional Edge 怎么根据结果走分支；
- 循环流程怎么表达；
- 多个节点怎么汇总结果；
- Checkpoint 怎么保存某一刻的 State。

建议课堂先按这个顺序运行：

```text
01_create_graph_demo.py             创建最小 LangGraph 流程
02_state_update_demo.py             State：节点如何读写流程数据
03_simple_edge_demo.py              Edge：多个节点按顺序执行
04_conditional_edge_demo.py         条件边：根据分数走不同分支
05_loop_retry_demo.py               循环：不满足条件就继续重试
06_parallel_summary_demo.py         多节点汇总：把多个结果合到 State
07_checkpoint_state_demo.py         Checkpoint 和 State 的关系
08_student_task_graph_demo.py       综合练习：学生任务处理流程
10_multiple_checkpoint_records_demo.py  一个 Checkpointer 保存多份记录
11_stream_output_demo.py            stream：观察每个节点的输出
```

下面这些是进阶能力，课堂时间够再看：

```text
12_store_long_term_memory_demo.py   Store：跨 thread 的长期记忆
13_runtime_context_demo.py          Runtime/context：运行时业务上下文
14_interrupt_human_in_loop_demo.py  Interrupt：人工确认后继续执行
15_time_travel_demo.py              Time Travel：回看并分叉历史状态
16_fault_tolerance_demo.py          Fault tolerance：重试和降级处理
17_ai_text_to_sql_interrupt_history_demo.py  Interrupt：暂停、继续运行和历史回看
```

`09_text_to_sql_mock_graph_demo.py` 先保留在目录里，后面讲 Text-to-SQL 时再单独使用。

运行方式：

```bash
uv run python -m test.langgraph_demo.01_create_graph_demo
```
