package cn.yanque.modules.ops.service;

import cn.hutool.core.util.StrUtil;
import cn.yanque.commons.apires.CommonErrorCode;
import cn.yanque.commons.config.SlsProperties;
import cn.yanque.commons.exception.BusinessException;
import cn.yanque.modules.ops.pojo.vo.reqvo.SlsLogQueryReq;
import cn.yanque.modules.ops.pojo.vo.resvo.SlsLogItemRes;
import cn.yanque.modules.ops.pojo.vo.resvo.SlsLogQueryRes;
import com.aliyun.openservices.log.Client;
import com.aliyun.openservices.log.common.LogContent;
import com.aliyun.openservices.log.common.QueriedLog;
import com.aliyun.openservices.log.exception.LogException;
import com.aliyun.openservices.log.request.GetLogsRequest;
import com.aliyun.openservices.log.response.GetLogsResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SlsLogQueryService {
    private static final int MAX_COMPLETION_ATTEMPTS = 3;
    private static final Pattern LIMIT_PATTERN = Pattern.compile("(?i)(\\blimit\\s+)(\\d+)");
    private static final Pattern SAFE_SERVICE = Pattern.compile("[a-zA-Z0-9._-]{1,100}");

    private final ObjectProvider<Client> clientProvider;
    private final SlsProperties properties;

    public SlsLogQueryService(ObjectProvider<Client> clientProvider, SlsProperties properties) {
        this.clientProvider = clientProvider;
        this.properties = properties;
    }

    public SlsLogQueryRes query(SlsLogQueryReq req) {
        validateRange(req);
        if (!properties.isEnabled()) {
            throw BusinessException.of(CommonErrorCode.FAILED,
                    "SLS 日志查询未启用，请在服务器 /opt/yanque/.env 配置 SLS_ENABLED=true 及 SLS 参数");
        }
        Client client = clientProvider.getIfAvailable();
        if (client == null) {
            throw BusinessException.of(CommonErrorCode.FAILED, "SLS 客户端未初始化，请检查服务器配置");
        }

        String query = buildQuery(req);
        boolean analysisQuery = query.contains("|");
        int maxRows = Math.min(Math.max(req.getLine() == null ? 100 : req.getLine(), 1), properties.getMaxRows());
        if (analysisQuery) {
            query = withSqlLimit(query, maxRows);
        }

        long started = System.currentTimeMillis();
        GetLogsResponse response = null;
        try {
            for (int attempt = 0; attempt < MAX_COMPLETION_ATTEMPTS; attempt++) {
                GetLogsRequest request = new GetLogsRequest(properties.getProject(), properties.getLogstore(),
                        Math.toIntExact(req.getFromTime()), Math.toIntExact(req.getToTime()), "", query,
                        0, analysisQuery ? 100 : maxRows, true, analysisQuery);
                response = client.GetLogs(request);
                if (response.IsCompleted()) {
                    break;
                }
                if (attempt + 1 < MAX_COMPLETION_ATTEMPTS) {
                    Thread.sleep(100L);
                }
            }
        } catch (LogException exception) {
            throw BusinessException.of(CommonErrorCode.FAILED, slsFailureMessage(exception));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw BusinessException.of(CommonErrorCode.FAILED, "SLS 日志查询被中断");
        } catch (ArithmeticException exception) {
            throw BusinessException.of(CommonErrorCode.PARAM_VALID_FAILED, "时间戳超出支持范围");
        }

        boolean completed = response != null && response.IsCompleted();
        return new SlsLogQueryRes(toRecords(response), System.currentTimeMillis() - started,
                completed, analysisQuery, response == null ? 0 : response.GetCount());
    }

    private void validateRange(SlsLogQueryReq req) {
        if (req.getFromTime() == null || req.getToTime() == null || req.getFromTime() >= req.getToTime()) {
            throw BusinessException.of(CommonErrorCode.PARAM_VALID_FAILED, "开始时间必须早于结束时间");
        }
        long maxSeconds = Math.max(properties.getMaxRangeHours(), 1) * 3600L;
        if (req.getToTime() - req.getFromTime() > maxSeconds) {
            throw BusinessException.of(CommonErrorCode.PARAM_VALID_FAILED,
                    "日志查询时间范围不能超过 " + properties.getMaxRangeHours() + " 小时");
        }
    }

    String buildQuery(SlsLogQueryReq req) {
        String query = StrUtil.blankToDefault(StrUtil.trim(req.getQuery()), "");
        if (StrUtil.isBlank(query)) {
            query = StrUtil.blankToDefault(StrUtil.trim(req.getKeyword()), "*");
        }
        if (StrUtil.isNotBlank(req.getService())) {
            if (!SAFE_SERVICE.matcher(req.getService().trim()).matches()) {
                throw BusinessException.of(CommonErrorCode.PARAM_VALID_FAILED, "服务名称包含非法字符");
            }
            // Logtail stores the Docker container name in the underscored field.
            String serviceFilter = "_container_name_:" + req.getService().trim();
            if ("*".equals(query)) {
                query = serviceFilter;
            } else if (query.contains("|")) {
                int pipeIndex = query.indexOf('|');
                query = query.substring(0, pipeIndex).trim() + " and " + serviceFilter
                        + " " + query.substring(pipeIndex).trim();
            } else {
                query = "(" + query + ") and " + serviceFilter;
            }
        }
        return query;
    }

    String withSqlLimit(String query, int maxRows) {
        Matcher matcher = LIMIT_PATTERN.matcher(query);
        if (matcher.find()) {
            int requested;
            try {
                requested = Integer.parseInt(matcher.group(2));
            } catch (NumberFormatException exception) {
                requested = maxRows;
            }
            int bounded = Math.min(Math.max(requested, 1), maxRows);
            return matcher.replaceFirst(Matcher.quoteReplacement(matcher.group(1) + bounded));
        }
        return query.trim() + " | limit " + maxRows;
    }

    private List<SlsLogItemRes> toRecords(GetLogsResponse response) {
        List<SlsLogItemRes> records = new ArrayList<>();
        if (response == null || response.GetLogs() == null) {
            return records;
        }
        for (QueriedLog queriedLog : response.GetLogs()) {
            if (queriedLog == null || queriedLog.GetLogItem() == null) {
                continue;
            }
            LinkedHashMap<String, String> fields = new LinkedHashMap<>();
            for (LogContent content : queriedLog.GetLogItem().GetLogContents()) {
                fields.put(content.GetKey(), redact(content.GetKey(), content.GetValue()));
            }
            records.add(new SlsLogItemRes(queriedLog.GetLogItem().GetTime(), queriedLog.GetSource(), fields));
        }
        return records;
    }

    private String redact(String key, String value) {
        if (key == null) {
            return value;
        }
        String normalized = key.toLowerCase();
        if (normalized.contains("token") || normalized.contains("password")
                || normalized.contains("secret") || normalized.contains("authorization")
                || normalized.contains("cookie") || normalized.contains("access_key")) {
            return "[REDACTED]";
        }
        return value;
    }

    private String slsFailureMessage(LogException exception) {
        String detail = exception == null ? "" : exception.getMessage();
        if (detail == null || detail.isBlank()) {
            return "SLS 日志查询失败，请检查 Endpoint、Project、LogStore、索引和 RAM 权限";
        }
        detail = detail.replaceAll("(?i)(access[-_ ]?key|secret|token|password|authorization)\\s*[:=]\\s*[^,; ]+",
                "$1=[REDACTED]");
        detail = detail.replaceAll("\\s+", " ").trim();
        if (detail.length() > 300) {
            detail = detail.substring(0, 300) + "...";
        }
        return "SLS 日志查询失败：" + detail;
    }
}
