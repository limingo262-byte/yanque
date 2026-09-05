# YanQue MCP、Agent、Skill 与 Text-to-SQL 会话总结

## 1. 本次项目最终形态

项目已经从“Python 内部编排 Text-to-SQL 流程”，升级为“Skill + MCP Resource + MCP Tool + Agent Runtime”的企业 AI 能力模式。

核心变化：

- Text-to-SQL 的完整流程规则沉淀到 Skill。
- Python 自己编写的 LangGraph 不再作为 Codex 对话的主流程调用者。
- 业务规则、业务术语、指标口径和表结构封装为 MCP Resource。
- 数据源查询、业务操作和外部系统访问封装为 MCP Tool。
- Codex 作为 MCP Client，根据 Skill 自主读取资源和调用工具。
- YanQue Admin 负责数据分析、运行记录、权限配置和评测管理。
- 数据源已经从老师的数据库切换为自己的业务数据库。
- 已经在 Codex 中直接提问，并通过 Bear MCP 成功完成 Text-to-SQL 查询和答案返回。

## 2. 最终调用链

```text
用户提出自然语言问题
        ↓
Codex 判断是否属于 YanQue Text-to-SQL 场景
        ↓
加载 yanque-text-to-sql Skill
        ↓
获取 yanque_text_to_sql Prompt
        ↓
读取 Business Resource
        ↓
指标问题读取 Metrics Resource
        ↓
读取涉及表的 Schema Resource
        ↓
生成安全的只读 SELECT SQL
        ↓
调用 query_data_source Tool
        ↓
Bear MCP 校验 Token、角色、工具和数据源权限
        ↓
查询自己的业务数据库
        ↓
返回查询结果
        ↓
Codex 组织 SQL、口径、结果和自然语言答案
```

## 3. Skill、Prompt、Resource、Tool 的区别

| 能力 | 解决的问题 | 示例 |
|---|---|---|
| Skill | 这个业务应该怎么处理 | `yanque-text-to-sql` |
| Prompt | 本次任务的参数和输出格式是什么 | `yanque_text_to_sql` |
| Resource | 业务事实和知识从哪里读取 | 业务规则、指标、表结构 |
| Tool | 具体动作如何执行 | `query_data_source` |
| Agent Runtime | 谁负责理解问题并循环调用工具 | Codex 或自建 Python Agent |

Skill 不等于 Tool。Tool 是一个动作，例如查询数据；Skill 是一套流程，例如先判断业务域，再读取业务资源、指标资源和表结构，最后调用查询工具。

## 4. Text-to-SQL Skill 的流程

`yanque-text-to-sql` Skill 负责：

1. 判断用户问题是否属于 YanQue 业务数据分析。
2. 将问题路由到订单、学生、教学、学习、作业、考试或 AI 等业务域。
3. 读取对应的 Business Resource。
4. 统计、趋势、排名、比例和 KPI 问题读取 Metrics Resource。
5. 读取 SQL 中每张表对应的 Schema Resource。
6. 只有在资源确认表、字段、关联关系和指标口径后才生成 SQL。
7. 只生成一条只读 `SELECT`。
8. 根据 `execute_sql` 参数判断是否调用 `query_data_source`。
9. 查询失败、资源缺失或口径不清时返回真实错误或提出澄清问题。

## 5. MCP Resource 设计

### 5.1 Business Resource

用于保存业务术语、状态含义、业务流程、过滤规则和时间字段说明。

```text
bear://yanque/text-to-sql/business/order
bear://yanque/text-to-sql/business/student
bear://yanque/text-to-sql/business/teaching
bear://yanque/text-to-sql/business/learning
bear://yanque/text-to-sql/business/homework
bear://yanque/text-to-sql/business/exam
bear://yanque/text-to-sql/business/ai
```

### 5.2 Metrics Resource

用于保存指标名称、计算公式、主表、时间字段、状态值、去重规则、拆分维度和金额单位。

```text
bear://yanque/text-to-sql/metrics/{domain}
```

### 5.3 Schema Resource

用于保存表名、字段、类型、主键、外键、Join 关系、枚举值、敏感字段和推荐过滤字段。

```text
bear://yanque/text-to-sql/schema/{tableName}
```

## 6. MCP Tool 设计

主要 Tool：

| Tool | 用途 |
|---|---|
| `list_data_sources` | 查询已发布数据源 |
| `query_data_source` | 执行受约束的只读 SQL |
| `list_mcp_resources` | 查看当前可访问 Resource |
| `read_mcp_resource` | 读取 Resource 正文 |
| `render_prompt` | 客户端不支持 `prompts/get` 时渲染 Prompt |
| `get_skill` | 获取并安装 Skill |

典型查询调用：

```json
{
  "name": "query_data_source",
  "arguments": {
    "datasource_id": "1",
    "sql": "SELECT order_id, amount FROM order_payment LIMIT 100"
  }
}
```

## 7. 查询业务和修改业务的 Tool 设计

### 7.1 查询类业务

统计分析适合 Text-to-SQL：

```text
查询本月各校区销售额
  -> 读取指标和表结构
  -> 生成 SELECT
  -> query_data_source
```

单对象查询适合固定参数 Tool：

```text
query_order(order_id)
query_student(student_id)
query_refund(refund_id)
```

固定查询 Tool 的 SQL 和返回字段由后端控制，比让模型自由生成 SQL 更安全。

### 7.2 修改类业务

修改、创建、审批、退款、发送消息等操作，不应该让模型自由生成 `UPDATE`、`DELETE` 或业务写 SQL，而应该设计为明确的业务 Tool：

```text
create_order
update_student
apply_refund
approve_leave
send_feishu_message
```

业务 Tool 的内部链路：

```text
MCP Tool
  -> 参数校验
  -> 当前用户和角色校验
  -> 业务规则校验
  -> Domain Service
  -> Repository 或内部 API
  -> 事务处理
  -> 审计日志
  -> 结构化返回
```

写操作建议使用确认流程：

```text
查询对象
  -> 读取业务规则
  -> 展示即将执行的动作
  -> 用户确认
  -> 调用写操作 Tool
```

## 8. Groovy Dynamic Tool 的定位

Groovy 是 Bear MCP 中动态 Tool 的一种实现方式，不是所有 Tool 的唯一实现方式。

适合使用 Groovy 的场景：

- 多个已有 HTTP/MOCK 接口的低风险编排；
- 变化较快的临时业务流程；
- 不希望每次修改都重新编译发布的简单能力。

当前设计链路：

```text
Dynamic Tool
  -> GroovyScriptEngine
  -> runRequest 白名单
  -> RequestConfigService
  -> HTTP / MOCK 请求配置
  -> 返回结构化结果
```

Groovy 不应该直接连接数据库、执行任意 SQL、读写文件或执行系统命令。应限制为：

- 只能调用注入的 `runRequest`；
- `runRequest` 只能访问已发布的请求配置；
- 禁止任意网络请求、文件读写、反射和系统命令；
- 设置超时、限流和审计；
- 资金、权限、审批和核心写操作优先使用 Java 固定 Tool。

推荐分层：

```text
核心查询/写操作 -> Java 固定 Tool
数据统计分析   -> query_data_source
快速组合流程   -> Groovy Dynamic Tool
流程规则       -> Skill
业务知识       -> Resource
```

## 9. 权限模型

最终有效能力：

```text
已发布且启用
∩ 用户角色权限
∩ 当前 Token 选择
```

相关表：

```text
mcp_role_tool                  角色拥有的 Tool
mcp_role_resource              角色拥有的 Resource
mcp_user_role                  用户和角色关系
mcp_user_tool_selection        Token 实际选择的 Tool
mcp_user_resource_selection    Token 实际选择的 Resource
```

运行时有两道校验：

1. `tools/list`、`resources/list` 只展示当前 Token 可见能力。
2. `tools/call`、`resources/read` 再次校验，防止客户端绕过列表直接调用。

Text-to-SQL Token 至少需要：

```text
list_mcp_resources
read_mcp_resource
list_data_sources
query_data_source
```

客户端不支持标准 Prompt 时增加：

```text
render_prompt
```

需要安装 Skill 时增加：

```text
get_skill
```

## 10. Agent Runtime 是否必须

服务器不一定要安装 Cursor，但必须有一个 Agent Runtime。

Agent Runtime 负责：

- 接收用户问题；
- 加载 Skill；
- 连接 MCP；
- 获取 MCP Tool；
- 调用大模型；
- 执行模型返回的 Tool Call；
- 将工具结果继续交回模型；
- 维护会话、超时和异常；
- 返回最终答案。

Codex 本身就是一个 Agent Runtime：

```text
Codex = 大模型 + Skill 理解 + MCP Client + Tool Calling Loop + 结果整合
```

如果飞书要调用，就可以在服务器部署一个通用 Python Agent Runtime，而不是重新实现 Text-to-SQL LangGraph：

```text
飞书
  -> Python Agent API
  -> 加载 Skill
  -> Bear MCP Client
  -> 大模型 Tool Calling Loop
  -> Bear MCP Tool/Resource
  -> 返回飞书消息
```

## 11. 飞书、Cursor、Bear MCP 的部署方式

推荐架构：

```text
个人 Cursor / Codex
          └──────────────┐
                         ↓
飞书 -> Python Agent -> Bear MCP Server
                              ↓
                 Skill、Prompt、Resource、Tool
                              ↓
                       自己的业务数据库
```

职责划分：

- 飞书：用户入口和消息展示；
- Cursor/Codex：开发、调试和个人对话入口；
- Python Agent：飞书场景下的通用 Agent Runtime；
- Bear MCP：能力暴露、权限、Resource、Tool 和审计；
- 数据库：个人业务数据；
- Skill：业务流程规则。

服务器安装 Cursor 只适合开发或演示。生产环境更适合运行无界面的 Python Agent 服务。个人电脑上的 Cursor 和服务器上的 Agent 不共享聊天会话，但可以共享同一个 Bear MCP 能力入口。

## 12. Skill 优化方法

Skill 优化不是简单把 Prompt 写长，而是优化 Agent 的决策过程。

### 12.1 优化触发条件

明确什么问题应该触发，什么问题不应该触发，减少误触发和漏触发。

### 12.2 优化工具选择

明确不同任务对应的 Tool：

```text
单订单状态 -> query_order
销售额趋势 -> query_data_source
读取规则   -> read_mcp_resource
客户端不支持 prompts/get -> render_prompt
```

### 12.3 优化 Resource 顺序

```text
Business
  -> Metrics
  -> Schema
  -> SQL
  -> query_data_source
```

### 12.4 优化异常处理

```text
口径不清       -> 先澄清
指标缺失       -> 返回 need_metric
表结构缺失     -> 不生成 SQL
execute_sql=false -> 只返回 SQL
数据源缺失     -> 不执行
查询失败       -> 返回真实错误
```

### 12.5 用评测验证优化

建议评估：

- Skill 正确触发率；
- Tool 选择正确率；
- Resource 读取完整率；
- SQL 安全通过率；
- SQL 执行成功率；
- 查询结果正确率；
- 最终答案正确率；
- 无依据猜测率；
- 需要澄清时的澄清率。

## 13. 简历写法

推荐项目名称：

```text
Bear MCP 企业 AI Agent 能力治理平台
```

项目描述：

> 面向企业数据分析和业务自动化场景，设计并实现基于 MCP 的 Agent 能力治理平台，统一封装数据库、HTTP API、业务 Tool、Resource、Prompt 和 Skill，为 Codex、Cursor 及飞书等客户端提供标准化能力接入。

Text-to-SQL 具体经历：

> 将 YanQue Text-to-SQL 从 Python LangGraph 内部编排模式升级为 Skill + MCP Resource + MCP Tool 模式，将业务术语、指标口径和表结构沉淀为 Resource，设计 Skill 规定业务域路由、Resource 读取顺序、SQL 安全边界和澄清规则，由 Agent 自动生成只读 SQL 并调用 `query_data_source` 查询个人业务数据库。

平台治理经历：

> 实现 Bearer Token 鉴权、角色权限与 Token 工具选择的双层授权、Tool/Resource 运行时过滤、动态 Groovy Tool 编排、请求配置白名单、调用审计、超时和限流控制。

测试结果：

> 完成 Codex → Bear MCP → Skill/Prompt → Business/Metrics/Schema Resource → `query_data_source` → 个人业务数据库 → 最终答案的端到端成功测试。

## 14. 面试重点回答

### Skill 和 Prompt 的区别

Skill 描述长期稳定的方法论和工作流程，Prompt 描述当前任务的运行参数和输出格式。Skill 偏流程规则，Prompt 偏单次任务配置。

### 为什么不继续使用 LangGraph

原来的 LangGraph 将流程固定写在 Python 节点中。现在把稳定规则放到 Skill，把知识放到 Resource，把动作放到 Tool，Agent 可以按任务动态组合。对于复杂状态、重试和人工审批流程，LangGraph 仍然有价值，并不是完全排斥。

### 只要有 Tool 就是 Skill 吗

不是。Tool 只是动作，Skill 是对多个 Resource 和 Tool 的业务流程编排。`query_data_source` 是工具，`yanque-text-to-sql` 才是完整的 Text-to-SQL Skill。

### 其他行业能否复用

可以复用平台架构，但要替换业务 Skill、Resource 和 Tool：

```text
电商 -> 订单、支付、退款
运营 -> 指标、趋势、日报
客服 -> 订单、物流、售后
教务 -> 学生、课程、考试
```

平台能力可以通用，但不能把尚未实际实现的行业场景写成已落地事实。

## 15. 当前最终结论

本项目已经可以从“一个固定的 Text-to-SQL 应用”表述为：

```text
企业 AI Agent 能力治理平台
  = Agent Runtime
  + Skill 流程编排
  + MCP Tool 动作执行
  + MCP Resource 业务知识
  + Prompt 任务参数
  + 权限治理
  + 调用审计
```

当前已验证的成功链路是：

```text
Codex
  -> Bear MCP
  -> Skill / Prompt / Resource
  -> query_data_source
  -> 自己的业务数据库
  -> 成功返回答案
```

这是后续扩展电商分析、运营报表、客服查询、飞书自动化和企业业务 Agent 的基础。
