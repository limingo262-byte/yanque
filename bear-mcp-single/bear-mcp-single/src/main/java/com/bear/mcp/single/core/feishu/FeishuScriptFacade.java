package com.bear.mcp.single.core.feishu;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Controlled Feishu surface exposed to dynamic Groovy tools. */
@Component
public class FeishuScriptFacade {
    private static final Pattern DOC_PATH = Pattern.compile("/(?:docx|wiki|docs)/([A-Za-z0-9]+)");
    private static final Set<String> ALLOWED_TOOLS = Set.of(
            "search-user", "get-user", "fetch-file", "search-doc", "create-doc",
            "fetch-doc", "update-doc", "list-docs", "get-comments", "add-comments");

    private final FeishuRemoteMcpService service;

    public FeishuScriptFacade(FeishuRemoteMcpService service) {
        this.service = service;
    }

    public Map<String, Object> listTools(String allowedTools) {
        return service.listTools(allowedTools);
    }

    public Map<String, Object> callTool(String toolName, Map<String, Object> arguments) {
        if (!StringUtils.hasText(toolName)) {
            return failure("tool_name 不能为空");
        }
        String normalized = toolName.trim();
        if (!ALLOWED_TOOLS.contains(normalized)) {
            return failure("不允许调用飞书工具: " + normalized);
        }
        return service.callTool(normalized, arguments);
    }

    public Map<String, Object> fetchDoc(String docId, String docUrl) {
        String resolved = resolveDocId(docId, docUrl);
        if (!StringUtils.hasText(resolved)) {
            return failure("请提供 doc_id 或可解析的 doc_url");
        }
        return callTool("fetch-doc", Map.of("doc_id", resolved));
    }

    public Map<String, Object> searchDoc(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return failure("keyword 不能为空");
        }
        return callTool("search-doc", Map.of("keyword", keyword.trim()));
    }

    public Map<String, Object> createDoc(String title, String markdown) {
        if (!StringUtils.hasText(title)) {
            return failure("title 不能为空");
        }
        Map<String, Object> args = new LinkedHashMap<>();
        args.put("title", title.trim());
        if (StringUtils.hasText(markdown)) {
            args.put("markdown", markdown);
        }
        return callTool("create-doc", args);
    }

    public Map<String, Object> addComment(String docId, String docUrl, String comment) {
        String resolved = resolveDocId(docId, docUrl);
        if (!StringUtils.hasText(resolved)) {
            return failure("请提供 doc_id 或可解析的 doc_url");
        }
        if (!StringUtils.hasText(comment)) {
            return failure("comment 不能为空");
        }
        Map<String, Object> args = new LinkedHashMap<>();
        args.put("doc_id", resolved);
        args.put("elements", java.util.List.of(Map.of("type", "text", "text", comment)));
        return callTool("add-comments", args);
    }

    private String resolveDocId(String docId, String docUrl) {
        if (StringUtils.hasText(docId)) {
            return docId.trim();
        }
        if (!StringUtils.hasText(docUrl)) {
            return null;
        }
        Matcher matcher = DOC_PATH.matcher(docUrl.trim());
        return matcher.find() ? matcher.group(1) : null;
    }

    private Map<String, Object> failure(String message) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("success", false);
        out.put("message", message);
        return out;
    }
}
