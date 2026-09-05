package com.bear.mcp.single.publicapi.controller;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class TestApiControllerTest {

    private final TestApiController controller = new TestApiController();

    @Test
    void returnsClockResponse() {
        Map<String, Object> result = controller.clock(Map.of("message", "hello"));

        assertThat(result).containsEntry("message", "hello");
        assertThat(result).containsKeys("currentTime", "timezone");
    }

    @Test
    void filtersAndPagesCourses() {
        Map<String, Object> result = controller.courses(Map.of(
                "keyword", "Java",
                "page", 1,
                "pageSize", 10
        ));

        assertThat(result).containsEntry("total", 1);
        assertThat((List<?>) result.get("list")).hasSize(1);
//        Atomic Integer index = new AtomicInteger();
    }
}
