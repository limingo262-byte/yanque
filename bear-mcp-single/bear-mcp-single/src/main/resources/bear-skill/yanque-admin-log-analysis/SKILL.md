---
name: yanque-admin-log-analysis
description: 分析 YanQue 项目线上日志，并结合只读源码和故障文档定位直接原因。
---

# YanQue 日志分析

用户要求查询或分析 YanQue 项目故障时使用本 Skill。目标服务默认是 yanque-admin，也可以根据问题切换到 yanque-ai 或 bear-mcp。

## 分析流程

1. 先调用 `tools/list` 做能力预检，确认至少存在 `query_yanque_sls_logs`。要做源码定位，还必须存在 `run_repository_command`；要走文档兜底，还必须存在 `create_log_error_analysis_document` 和 `recall_log_error_analysis_document`。缺少工具时必须明确“证据链未闭合”，不能声称已完成该步骤。
2. 确认服务、时间范围、业务关键词或 requestId/traceId；没有准确条件时先使用最近 10 分钟。
3. 首选调用 `query_yanque_sls_logs`，传入 Unix 秒级 `from_time`、`to_time`，再按需传 `service`、`keyword`、`query`、`line`。时间范围不要超过 24 小时，首次建议 `keyword=ERROR`、`line=100`。该 Tool 通过 Bear 与 Admin 的内部网络和共享服务令牌访问 SLS，模型不接触云端密钥。
4. 发现 requestId、traceId 或异常类名后，用同一标识再次调用 `query_yanque_sls_logs`，缩小到一次具体请求；分析 SQL 必须自己带 `| limit N`，并尊重返回的 `completed` 状态。当前 LogStore 未将 `_container_name_` 建索引，服务筛选由 Admin 在返回记录上完成，不要把 `_container_name_:` 拼进 SLS 查询语句。
5. 提取异常类型、报错信息、第一处业务堆栈和服务名。不要把完整日志原文直接当作结论。
6. 对 yanque-admin 调用 `run_repository_command`，仓库参数固定为 `yanque-admin`：先用 `rg` 定位类/方法，再用 `sed` 或 `nl` 读取附近代码。源码工具只能读取，不能修改。
7. 如果 SLS 暂时不可用、日志已过期或缺少堆栈，只有在两个文档工具都可用时，才能上传脱敏后的 Markdown/JSON 故障文档并召回相似故障；召回结果只能作为辅助证据。
8. 用日志事实、源码逻辑和文档召回结果交叉验证后再下结论，不读取整个仓库，也不把向量召回当作实时日志。

## 工具职责

- `query_yanque_sls_logs`：实时查询 SLS，是第一证据源。
- `run_repository_command`：读取服务器上挂载的 yanque-admin 源码，验证堆栈对应的实现。
- `create_log_error_analysis_document`：SLS 不可用时，上传已经脱敏的错误日志、堆栈和处理记录文档。
- `recall_log_error_analysis_document`：从已向量化的故障文档中找相似案例，只能作为辅助证据。

不要调用旧的 `query_log_analysis_search_tool` 代替 SLS 查询；它可能是历史数据库配置，不能保证返回 Docker stdout 日志。

## 判断标准

- 日志和源码相互印证：说明已确认原因。
- 只有部分线索：说明推测依据和待确认项。
- 只有文档召回结果：标记为历史相似案例，不能冒充本次线上事实。
- 证据不足：明确缺少的日志、上下文或源码版本，不编造原因。

## 输出格式

按照以下顺序输出：问题结论、影响范围、判断依据、处理建议、待确认信息。区分运营可以处理的事项和需要研发处理的事项。

## 安全限制

只读取 yanque-admin 源码。不得修改文件、执行 shell 拼接或读取密钥、Token、`.env`、私钥和证书。日志输出前脱敏手机号、邮箱、Token、Cookie、Authorization、AccessKey、密码和其他敏感信息。时间、服务、请求 ID 和异常堆栈可以保留。
