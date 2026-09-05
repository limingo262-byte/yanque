package com.bear.mcp.single.publicapi.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** 本地可用的 HTTP 测试接口，供 API 创作和动态工具课堂演示。 */
@RestController
@RequestMapping("/api/test")
public class TestApiController {

    private static final List<Map<String, Object>> COURSES = List.of(
            course("COURSE-001", "Java 程序设计", "张老师", 32),
            course("COURSE-002", "Spring Boot 企业开发", "李老师", 24),
            course("COURSE-003", "Python 数据分析", "王老师", 28),
            course("COURSE-004", "人工智能基础", "陈老师", 36),
            course("COURSE-005", "数据库系统原理", "赵老师", 30)
    );

    @PostMapping("/clock")
    public Map<String, Object> clock(@RequestBody(required = false) Map<String, Object> params) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", value(params, "message", "默认消息"));
        result.put("currentTime", OffsetDateTime.now().toString());
        result.put("timezone", OffsetDateTime.now().getOffset().toString());
        return result;
    }

    @PostMapping("/courses")
    public Map<String, Object> courses(@RequestBody(required = false) Map<String, Object> params) {
        String keyword = value(params, "keyword", "").trim();
        int page = positiveInt(params, "page", 1);
        int pageSize = Math.min(positiveInt(params, "pageSize", 10), 100);
        String normalizedKeyword = keyword.toLowerCase(Locale.ROOT);

        List<Map<String, Object>> matched = COURSES.stream()
                .filter(course -> normalizedKeyword.isEmpty()
                        || course.values().stream().anyMatch(value -> value.toString()
                        .toLowerCase(Locale.ROOT).contains(normalizedKeyword)))
                .toList();
        int fromIndex = Math.min((page - 1) * pageSize, matched.size());
        int toIndex = Math.min(fromIndex + pageSize, matched.size());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("keyword", keyword);
        result.put("page", page);
        result.put("pageSize", pageSize);
        result.put("total", matched.size());
        result.put("list", matched.subList(fromIndex, toIndex));
        return result;
    }

    private static Map<String, Object> course(String id, String name, String teacher, int hours) {
        return Map.of("id", id, "name", name, "teacher", teacher, "hours", hours);
    }

    private String value(Map<String, Object> params, String key, String defaultValue) {
        if (params == null || params.get(key) == null) {
            return defaultValue;
        }
        return params.get(key).toString();
    }

    private int positiveInt(Map<String, Object> params, String key, int defaultValue) {
        try {
            int value = Integer.parseInt(value(params, key, Integer.toString(defaultValue)));
            return value > 0 ? value : defaultValue;
        } catch (NumberFormatException ignored) {
            return defaultValue;
        }
    }
}
