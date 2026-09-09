package com.bear.mcp.single.core.storage;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TosStorageServiceTest {

    @Test
    void readsBundledBearSkillFromLocalUriWithoutTosConfig() {
        TosStorageService service = new TosStorageService(new TosStorageProperties());

        String markdown = service.downloadString("local://bear-skill/yanque-admin-log-analysis/SKILL.md");

        assertTrue(markdown.contains("name: yanque-admin-log-analysis"));
        assertTrue(markdown.contains("query_yanque_sls_logs"));
        assertTrue(markdown.contains("run_repository_command"));
    }

    @Test
    void rejectsLocalPathTraversal() {
        TosStorageService service = new TosStorageService(new TosStorageProperties());

        assertThrows(IllegalArgumentException.class,
                () -> service.downloadString("local://../application.yml"));
    }
}