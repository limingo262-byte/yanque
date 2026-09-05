# YanQue Text-to-SQL 最终版升级说明与汇报讲稿

> 口径说明：本文按老师描述的最终版架构编写。当前实际测试已经切换到个人业务数据库，并在 Codex 中通过 Bear MCP 提问，成功完成 Text-to-SQL 查询并返回答案。

## 一、项目最终改变

这次升级的核心不是简单增加几个接口，而是把 Text-to-SQL 从 Python 应用内部的一套固定流程，升级成了由 MCP 统一暴露、由 Agent 按 Skill 执行的企业数据分析能力。

旧版本中，Python 自己编写 LangGraph，负责意图识别、业务检索、选表、生成 SQL、执行 SQL 和结果总结。最终版本不再把这套 Python LangGraph 作为主流程调用者，而是把流程方法论沉淀为 Skill，把业务知识、指标口径和表结构沉淀为 MCP Resource，把数据源查询等动作封装为 MCP Tool。

最终由 Codex 连接 Bear MCP。Codex 根据 Skill 判断任务类型，读取所需 Resource，生成安全 SQL，再调用 Tool 获取个人业务数据库中的数据，最后向用户返回 SQL、口径、结果和分析结论。该链路已经完成实际成功测试。

## 二、最终架构与调用链

```text
用户问题
  -> Codex 识别 YanQue Text-to-SQL 场景
  -> 加载 yanque-text-to-sql Skill
  -> 获取 yanque_text_to_sql Prompt
  -> 读取 Business Resource
  -> 指标问题读取 Metrics Resource
  -> 读取每张涉及表的 Schema Resource
  -> 生成一条只读 SELECT SQL
  -> 调用 query_data_source
  -> Bear MCP 校验 Tool、数据源和 SQL 查询边界
  -> 返回查询结果
  -> Codex 生成最终答案
```

Skill 规定长期方法论和安全规则；Prompt 提供本次任务参数，例如 `question`、`datasource_id`、`max_rows` 和 `execute_sql`；Resource 只负责提供事实和知识；Tool 负责执行动作。注意：Prompt 参数名 `datasource_id` 与 Tool 入参不同，实际调用 `query_data_source` 时使用 MCP schema 规定的 `datasourceId`。

## 三、Skill、Prompt、Resource、Tool 的职责

| 能力 | 主要职责 | MCP 使用方式 |
|---|---|---|
| Skill | 触发条件、业务域路由、Resource 读取顺序、SQL 规则 | 获取或安装 `yanque-text-to-sql` |
| Prompt | 当前问题参数、是否执行、输出格式 | `prompts/get` 或 `render_prompt` |
| Business Resource | 状态、业务术语、业务流程和过滤规则 | `resources/read` |
| Metrics Resource | 指标公式、时间字段、去重规则和金额单位 | `resources/read` |
| Schema Resource | 表、字段、主键、关联关系和枚举值 | `resources/read` |
| Tool | 查看数据源、执行只读 SQL 等动作 | `tools/call` |

## 四、权限如何改变

MCP 权限采用“角色上限 + Token 实际选择”的两层模型，并在运行时再次校验。

```text
最终有效能力 = 已发布且启用的能力
            ∩ 用户角色拥有的能力
            ∩ 当前 Token 选择的能力
```

角色权限表：

- `mcp_role_tool`：角色能够使用哪些 Tool。
- `mcp_role_resource`：角色能够读取哪些 Resource。
- `mcp_user_role`：用户拥有哪些角色。

Token 选择表：

- `mcp_user_tool_selection`：当前 Token 实际暴露哪些 Tool。
- `mcp_user_resource_selection`：当前 Token 实际暴露哪些 Resource。

运行时有两道防线：

1. `tools/list` 和 `resources/list` 只返回当前 Token 可见的能力。
2. `tools/call` 和 `resources/read` 再次检查权限，客户端即使手工构造请求也不能绕过授权。

Text-to-SQL Token 至少需要配置：

```text
list_mcp_resources
read_mcp_resource
list_data_sources
query_data_source
```

客户端不支持标准 Prompt 调用时，再增加：

```text
render_prompt
```

需要通过 MCP 安装 Skill 时，再增加：

```text
get_skill
```

## 五、工具和资源怎么调用

标准 MCP 会话先执行 `initialize`，随后客户端通过 JSON-RPC 调用：

```text
tools/list
resources/list
prompts/list
prompts/get
tools/call
resources/read
```

Text-to-SQL 的实际顺序是：

1. 获取 `yanque_text_to_sql` Prompt；如果客户端不支持 Prompt，则调用 `render_prompt`。
2. 根据问题选择业务域，读取：

   ```text
   bear://yanque/text-to-sql/business/{domain}
   ```

3. 如果是统计、趋势、排名、比例或 KPI 问题，再读取：

   ```text
   bear://yanque/text-to-sql/metrics/{domain}
   ```

4. 对 SQL 中涉及的每一张表读取：

   ```text
   bear://yanque/text-to-sql/schema/{tableName}
   ```

   规划中的 `schema` 在当前 Bear MCP 实现中对应已发布的 `ddl` URI，例如 `bear://yanque/text-to-sql/ddl/student`；调用前必须以 `resources/list` 返回的实际 URI 为准。

5. 生成 SQL 后，只有 `execute_sql=true` 且数据源 ID 非空时，调用：

   ```json
   {
     "name": "query_data_source",
    "arguments": {
      "datasourceId": 1,
      "sql": "SELECT order_id, amount FROM order_payment LIMIT 100"
     }
   }
   ```

6. Codex 根据返回结果组织答案，并引用使用过的 Resource。

## 六、SQL 安全边界

- 只允许一条只读 `SELECT`。
- 禁止 `INSERT`、`UPDATE`、`DELETE`、DDL、存储过程和多语句。
- 禁止分号和 `SELECT *`。
- 表名、字段名和关联字段必须来自 Schema Resource。
- 明细查询必须带 `LIMIT`，系统最大返回行数为 500。
- 指标必须优先遵循 Metrics Resource 的公式、时间字段和去重规则。
- 手机号、密码等敏感字段不作为默认展示字段。
- 指标或业务口径不清时先澄清，不允许模型自行猜测。

## 七、YanQue Admin 的职责

Admin 继续负责管理和评测闭环：

- Text-to-SQL 数据分析页面；
- SQL、结果、图表和运行记录展示；
- 用户反馈；
- 角色字段数据权限配置；
- 评测问题、断言和评测任务管理；
- 评测结果统计和失败样本分析。

需要向老师明确区分两条链路：

- Codex 对话链路：Codex -> Bear MCP -> Tool/Resource -> 数据源。
- 当前 Admin 遗留链路：Admin -> Python `/ai/text-to-sql/query` -> `TextToSqlGraph`。

当前源码确实仍能看到第二条链路；它作为历史实现和兼容入口保留，但不应再表述为 Codex 的最终 MCP 主流程。本次已确认的是 Codex 对话链路成功；Admin 的分析、运行记录和评测功能继续按 Admin 现有接口承担管理闭环。若后续要求 Admin 也完全走 MCP，再增加 Admin MCP Client 适配层并重新验证批量评测、身份传递和运行记录。

## 八、汇报时可以这样讲

“这次升级的核心，是把 Text-to-SQL 从 Python 内部的一套 LangGraph 流程，变成了 MCP 平台上的可治理能力。过去 Python 代码负责把意图识别、检索、选表、生成 SQL、执行和总结串起来；现在这些规则沉淀到 Skill，业务知识、指标口径和表结构沉淀成 Resource，查询动作封装成 Tool。现在我使用自己的业务数据库，Codex 连接 Bear MCP 后，可以根据问题读取相应资源，生成安全的只读 SQL，再调用数据查询工具返回结果，实测已经能够成功回答。权限上采用角色权限和 Token 选择的交集，工具列表过滤和实际调用都会校验。YanQue Admin 则负责数据分析、运行记录、字段权限和评测任务，形成从能力发布、授权、调用到评测的闭环。”

## 九、验收顺序

```text
initialize
 -> tools/list
 -> resources/list
 -> prompts/list 或 render_prompt
 -> 读取业务 Resource
 -> 读取指标 Resource
 -> 读取 Schema Resource
 -> query_data_source
 -> 检查审计日志
 -> 使用无权限 Token 重试并确认被拒绝
```

## 十、资源补充情况

仓库原有资源已经覆盖 7 个业务域的 Business/Metric、主要业务表 Schema、Text-to-SQL Skill 和 Prompt。本次新增的治理资源见：

- `text-to-sql-resources/yanque-agent/README.md`：Agent 资源总索引。
- `text-to-sql-resources/yanque-agent/datasource.md`：数据源使用说明。
- `text-to-sql-resources/yanque-agent/security.md`：安全和敏感字段规则。
- `text-to-sql-resources/yanque-agent/evaluation.md`：评测样本和断言规则。
- `docs/mysql-migrate-yanque-text-to-sql-permissions.sql`：角色、Token、Tool、Resource 权限绑定模板。

这些资源不替代已有业务资源，而是补齐 Agent 运行时需要的索引、边界和评测说明。

## 十一、个人数据库与 Codex MCP 测试结论

本次环境已经从老师提供的数据库切换为个人数据库。个人数据库初始化脚本见 `文档/mysql-init-yanque-text-to-sql-demo.sql`，当前演示表为 `student`、`sys_class`、`order_payment`；数据源配置、连接凭证和数据库内容以本地实际配置为准，不在文档中记录明文密码。

已完成的成功路径：

```text
Codex 提问
  -> Bear MCP 识别并加载 Text-to-SQL Skill/Prompt
  -> 读取业务、指标和表结构 Resource
  -> 生成只读 SQL
  -> 调用 query_data_source
  -> 查询个人数据库
  -> Codex 返回 SQL、结果和自然语言答案
```

本次真实验收使用的 Tool 参数为 `datasourceId=1`，执行 `SELECT COUNT(s.id) AS student_total FROM student s`，返回 `student_total=3`。

详细测试记录见：

- `文档/Text-to-SQL-Codex通过MCP个人数据库成功测试记录_2026-09-04.md`
