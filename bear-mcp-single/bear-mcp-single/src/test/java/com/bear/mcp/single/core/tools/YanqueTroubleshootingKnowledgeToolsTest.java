package com.bear.mcp.single.core.tools;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class YanqueTroubleshootingKnowledgeToolsTest {

    @Test
    void shouldFindPermissionKnowledge() {
        YanqueTroubleshootingKnowledgeTools tools = new YanqueTroubleshootingKnowledgeTools();

        Map<String, Object> result = tools.searchKnowledge("有人访问页面提示没有权限", 3);

        assertThat((Integer) result.get("matched")).isGreaterThanOrEqualTo(1);
        List<?> items = (List<?>) result.get("items");
        Map<?, ?> first = (Map<?, ?>) items.get(0);
        assertThat(first.get("title").toString()).contains("没有权限");
        assertThat(first.get("content").toString()).contains("PermissionInterceptor");
    }

    @Test
    void shouldFindOrderKnowledge() {
        YanqueTroubleshootingKnowledgeTools tools = new YanqueTroubleshootingKnowledgeTools();

        Map<String, Object> result = tools.searchKnowledge("今天下午三点提交订单失败", 3);

        assertThat((Integer) result.get("matched")).isGreaterThanOrEqualTo(1);
        List<?> items = (List<?>) result.get("items");
        Map<?, ?> first = (Map<?, ?>) items.get(0);
        assertThat(first.get("content").toString()).contains("订单");
    }
}

