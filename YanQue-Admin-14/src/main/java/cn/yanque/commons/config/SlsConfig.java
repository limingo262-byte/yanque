package cn.yanque.commons.config;

import com.aliyun.openservices.log.Client;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/** Creates one shared SLS SDK client and closes it with the application. */
@Configuration
@EnableConfigurationProperties(SlsProperties.class)
public class SlsConfig {
    @Bean(destroyMethod = "shutdown")
    @ConditionalOnProperty(prefix = "sls", name = "enabled", havingValue = "true")
    public Client slsClient(SlsProperties properties) {
        require(properties.getEndpoint(), "SLS_ENDPOINT");
        require(properties.getProject(), "SLS_PROJECT");
        require(properties.getLogstore(), "SLS_LOGSTORE");
        require(properties.getAccessKeyId(), "ALIBABA_CLOUD_ACCESS_KEY_ID");
        require(properties.getAccessKeySecret(), "ALIBABA_CLOUD_ACCESS_KEY_SECRET");
        return new Client(properties.getEndpoint(), properties.getAccessKeyId(), properties.getAccessKeySecret());
    }

    private void require(String value, String envName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("SLS 已启用，但未配置 " + envName);
        }
    }
}
