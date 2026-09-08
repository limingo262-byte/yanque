package com.bear.mcp.single.core.tools;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/** MCP bridge for the Admin SLS query endpoint. */
@Component
public class YanqueLogQueryTools {
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    private static final String PATH = "/yq-admin/internal/ops/logs/query";

    private final ObjectMapper objectMapper;
    private final String adminBaseUrl;
    private final OkHttpClient client;

    public YanqueLogQueryTools(ObjectMapper objectMapper,
                               @Value("${yanque-admin.base-url:http://yanque-admin:8080}") String adminBaseUrl) {
        this.objectMapper = objectMapper;
        this.adminBaseUrl = adminBaseUrl.replaceAll("/+$", "");
        this.client = new OkHttpClient.Builder()
                .connectTimeout(3, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    @Tool(name = "query_yanque_sls_logs", description = "查询 YanQue Admin 采集到阿里云 SLS 的日志。先用较短时间范围和 ERROR/关键词查询；发现 requestId、traceId 或异常后，再用同一关键词缩小范围。支持纯查询语句和 SLS 分析 SQL，服务名通常为 yanque-admin、yanque-ai 或 bear-mcp。")
    public Map<String, Object> queryLogs(
            @ToolParam(description = "开始时间，Unix 秒时间戳，必填", required = true) Long from_time,
            @ToolParam(description = "结束时间，Unix 秒时间戳，必填", required = true) Long to_time,
            @ToolParam(description = "关键词，例如 ERROR、异常类名、requestId 或 traceId，可选", required = false) String keyword,
            @ToolParam(description = "SLS 查询或分析语句，可选；分析语句可使用 | limit N", required = false) String query,
            @ToolParam(description = "服务名，可选，例如 yanque-admin、yanque-ai、bear-mcp", required = false) String service,
            @ToolParam(description = "最多返回条数，1 到 500，默认 100", required = false) Integer line
    ) {
        if (from_time == null || to_time == null || from_time >= to_time) {
            return failure("from_time 必须早于 to_time");
        }
        if (keyword != null && keyword.length() > 1000 || query != null && query.length() > 4000) {
            return failure("关键词或查询语句过长");
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("fromTime", from_time);
        payload.put("toTime", to_time);
        payload.put("keyword", blankToEmpty(keyword));
        payload.put("query", blankToEmpty(query));
        payload.put("service", blankToEmpty(service));
        payload.put("line", line == null ? 100 : Math.min(Math.max(line, 1), 500));

        try {
            Request request = new Request.Builder()
                    .url(adminBaseUrl + PATH)
                    .post(RequestBody.create(objectMapper.writeValueAsString(payload), JSON))
                    .header("X-Bear-Mcp-Request", "true")
                    .build();
            try (Response response = client.newCall(request).execute()) {
                String body = response.body() == null ? "" : response.body().string();
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("status", response.code());
                result.put("success", response.isSuccessful());
                if (!body.isBlank()) {
                    try {
                        result.put("response", objectMapper.readValue(body, new TypeReference<Map<String, Object>>() {}));
                    } catch (Exception ignored) {
                        result.put("response", body);
                    }
                }
                return result;
            }
        } catch (Exception exception) {
            return failure("YanQue Admin SLS 日志接口调用失败: " + exception.getMessage());
        }
    }

    private String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private Map<String, Object> failure(String message) {
        return Map.of("success", false, "error", message);
    }
}
