package cn.yanque.commons.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** SLS connection settings. Secrets are supplied by the process environment. */
@Data
@ConfigurationProperties(prefix = "sls")
public class SlsProperties {
    private boolean enabled;
    private String endpoint;
    private String project;
    private String logstore;
    private String accessKeyId;
    private String accessKeySecret;
    private int maxRangeHours = 24;
    private int maxRows = 500;
}
