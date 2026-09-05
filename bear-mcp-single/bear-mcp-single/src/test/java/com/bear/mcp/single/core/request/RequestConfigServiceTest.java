package com.bear.mcp.single.core.request;

import com.bear.mcp.single.core.entity.McpRequestConfigEntity;
import com.bear.mcp.single.core.mapper.McpRequestConfigMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RequestConfigServiceTest {

    private final McpRequestConfigMapper mapper = mock(McpRequestConfigMapper.class);
    private final RequestConfigService service = new RequestConfigService(mapper, new ObjectMapper());

    @Test
    void executesMockConfigWithoutExternalClient() {
        when(mapper.findByConfigKey("demo_clock")).thenReturn(config("MOCK"));

        Object result = service.execute("demo_clock", Map.of("message", "hello mcp"));

        assertThat(result).isInstanceOf(Map.class);
        Map<?, ?> response = (Map<?, ?>) result;
        assertThat(response.get("status")).isEqualTo(200);
        assertThat(response.get("body")).isInstanceOf(Map.class);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.get("body");
        assertThat(body)
                .containsEntry("message", "hello mcp")
                .containsEntry("requestKey", "demo_clock")
                .containsKey("timestamp");
    }

    @Test
    void rejectsUnsupportedProtocolWithSupportedTypesInMessage() {
        when(mapper.findByConfigKey("demo_clock")).thenReturn(config("SOA"));

        assertThatThrownBy(() -> service.execute("demo_clock", Map.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("HTTP 和 MOCK");
    }

    private McpRequestConfigEntity config(String type) {
        McpRequestConfigEntity entity = new McpRequestConfigEntity();
        entity.setRequestId("API0000000001");
        entity.setConfigKey("demo_clock");
        entity.setName("课堂演示时钟");
        entity.setType(type);
        entity.setMethod(type);
        entity.setHeaders("{}");
        entity.setParamsDefault("{\"message\":\"默认消息\"}");
        entity.setIsEnabled(1);
        entity.setRateLimitPerMinute(0);
        return entity;
    }
}
