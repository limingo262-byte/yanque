package com.bear.mcp.single.core.tools;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** YanQue 业务问题排障知识检索工具。 */
@Component
public class YanqueTroubleshootingKnowledgeTools {
    private static final String KNOWLEDGE_PATTERN = "classpath*:/bear-troubleshooting/yanque/*.md";
    private static final int DEFAULT_LIMIT = 3;
    private static final int MAX_LIMIT = 5;
    private static final Pattern HEADING_PATTERN = Pattern.compile("^#\\s+(.+)$", Pattern.MULTILINE);
    private static final Pattern KEYWORDS_PATTERN = Pattern.compile("(?im)^关键词[:：]\\s*(.+)$");
    private static final Pattern SUMMARY_PATTERN = Pattern.compile("(?is)##\\s*适用场景\\s*(.+?)(?=\\n##\\s|\\z)");

    private final List<TroubleshootingDocument> documents;

    public YanqueTroubleshootingKnowledgeTools() {
        this.documents = loadDocuments();
    }

    @Tool(name = "search_yanque_troubleshooting_knowledge",
            description = "检索 YanQue 常见业务问题排障知识。返回的是候选排查路径，必须再结合当前日志、源码和数据库只读查询验证，不能直接当成本次故障结论。")
    public Map<String, Object> searchKnowledge(
            @ToolParam(description = "业务现象、错误提示、接口名、页面名、表名或日志关键词，例如：提交订单失败、没有权限、付款成功但课程没开通。", required = true)
            String query,
            @ToolParam(description = "返回条数，默认 3，最大 5。", required = false)
            Integer limit
    ) {
        if (!StringUtils.hasText(query)) {
            throw new IllegalArgumentException("query 不能为空");
        }
        int size = limit == null ? DEFAULT_LIMIT : Math.max(1, Math.min(limit, MAX_LIMIT));
        List<String> terms = extractTerms(query);
        List<Map<String, Object>> matches = documents.stream()
                .map(doc -> score(doc, query, terms))
                .filter(match -> ((Number) match.get("score")).intValue() > 0)
                .sorted(Comparator.<Map<String, Object>, Integer>comparing(item -> (Integer) item.get("score")).reversed()
                        .thenComparing(item -> String.valueOf(item.get("title"))))
                .limit(size)
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("query", query);
        result.put("matched", matches.size());
        result.put("items", matches);
        result.put("usage_note", "这些知识只提供候选排查路径；下结论前必须用 query_yanque_sls_logs、run_repository_command 和 query_data_source 验证当前请求。数据库查询必须只读、限字段、带 LIMIT。");
        return result;
    }

    private List<TroubleshootingDocument> loadDocuments() {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        List<TroubleshootingDocument> loaded = new ArrayList<>();
        try {
            Resource[] resources = resolver.getResources(KNOWLEDGE_PATTERN);
            for (Resource resource : resources) {
                if (!resource.isReadable()) {
                    continue;
                }
                String content;
                try (InputStream inputStream = resource.getInputStream()) {
                    content = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                }
                String path = resource.getFilename() == null ? "unknown.md" : resource.getFilename();
                loaded.add(parse(path, content));
            }
        } catch (IOException e) {
            throw new IllegalStateException("加载 YanQue 排障知识失败", e);
        }
        return List.copyOf(loaded);
    }

    private TroubleshootingDocument parse(String path, String content) {
        String title = firstMatch(HEADING_PATTERN, content, 1, path);
        String keywords = firstMatch(KEYWORDS_PATTERN, content, 1, "");
        String summary = firstMatch(SUMMARY_PATTERN, content, 1, "").trim();
        if (summary.length() > 500) {
            summary = summary.substring(0, 500) + "...";
        }
        return new TroubleshootingDocument(path, title, keywords, summary, content);
    }

    private Map<String, Object> score(TroubleshootingDocument doc, String query, List<String> terms) {
        String lowerTitle = doc.title().toLowerCase(Locale.ROOT);
        String lowerKeywords = doc.keywords().toLowerCase(Locale.ROOT);
        String lowerContent = doc.content().toLowerCase(Locale.ROOT);
        String lowerQuery = query.toLowerCase(Locale.ROOT);
        int score = 0;
        List<String> hitTerms = new ArrayList<>();
        for (String term : terms) {
            String lowerTerm = term.toLowerCase(Locale.ROOT);
            int termScore = 0;
            if (lowerTitle.contains(lowerTerm)) {
                termScore += 8;
            }
            if (lowerKeywords.contains(lowerTerm)) {
                termScore += 6;
            }
            if (lowerContent.contains(lowerTerm)) {
                termScore += 2;
            }
            if (termScore > 0) {
                score += termScore;
                hitTerms.add(term);
            }
        }
        if (lowerContent.contains(lowerQuery)) {
            score += 10;
        }

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("title", doc.title());
        item.put("document", doc.path());
        item.put("score", score);
        item.put("hit_terms", hitTerms);
        item.put("keywords", doc.keywords());
        item.put("summary", doc.summary());
        item.put("content", doc.content());
        return item;
    }

    private static String firstMatch(Pattern pattern, String content, int group, String defaultValue) {
        Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            return matcher.group(group).trim();
        }
        return defaultValue;
    }

    private static List<String> extractTerms(String query) {
        Set<String> terms = new LinkedHashSet<>();
        String normalized = query.replaceAll("[，。！？、；：,.!?;:\\s]+", " ").trim();
        for (String part : normalized.split(" ")) {
            if (part.length() >= 2) {
                terms.add(part);
            }
        }
        String[] commonTerms = {
                "订单", "提交订单", "下单", "支付", "付款", "课程", "产品", "学员", "用户", "登录", "权限", "无权访问", "403",
                "Token", "不能为空", "失败", "异常", "页面", "接口", "订单失败", "没有权限", "课程没开通", "产品关系"
        };
        for (String term : commonTerms) {
            if (query.contains(term)) {
                terms.add(term);
            }
        }
        if (terms.isEmpty()) {
            terms.add(query);
        }
        return List.copyOf(terms);
    }

    private record TroubleshootingDocument(String path, String title, String keywords, String summary, String content) {
    }
}
