package cn.yanque.modules.ops.service;

import cn.yanque.commons.config.SlsProperties;
import cn.yanque.commons.exception.BusinessException;
import cn.yanque.modules.ops.pojo.vo.reqvo.SlsLogQueryReq;
import com.aliyun.openservices.log.Client;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.ObjectProvider;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SlsLogQueryServiceTest {
    @Test
    void disabledSlsReturnsActionableError() {
        SlsProperties properties = properties(false);
        SlsLogQueryService service = new SlsLogQueryService(emptyClientProvider(), properties);
        SlsLogQueryReq request = request(100, 200);

        BusinessException exception = assertThrows(BusinessException.class, () -> service.query(request));

        assertEquals("SLS 日志查询未启用，请在服务器 /opt/yanque/.env 配置 SLS_ENABLED=true 及 SLS 参数",
                exception.getMessage());
    }

    @Test
    void rangeBeyondLimitIsRejectedBeforeClientCall() {
        SlsProperties properties = properties(false);
        properties.setMaxRangeHours(1);
        SlsLogQueryService service = new SlsLogQueryService(emptyClientProvider(), properties);
        SlsLogQueryReq request = request(100, 3701);

        BusinessException exception = assertThrows(BusinessException.class, () -> service.query(request));

        assertEquals("日志查询时间范围不能超过 1 小时", exception.getMessage());
    }

    @Test
    void sqlLimitIsAddedAndBounded() {
        SlsLogQueryService service = new SlsLogQueryService(emptyClientProvider(), properties(false));

        assertEquals("level:error | select count(*) as total | limit 100",
                service.withSqlLimit("level:error | select count(*) as total", 100));
        assertEquals("level:error | select * from log limit 100",
                service.withSqlLimit("level:error | select * from log limit 1000", 100));
    }

    @Test
    void serviceFilterIsPlacedBeforeSqlPipeline() {
        SlsLogQueryService service = new SlsLogQueryService(emptyClientProvider(), properties(false));
        SlsLogQueryReq request = request(100, 200);
        request.setQuery("level:error | select *");
        request.setService("yanque-admin");

        assertEquals("level:error and _container_name_:yanque-admin | select *", service.buildQuery(request));
    }

    private static SlsProperties properties(boolean enabled) {
        SlsProperties properties = new SlsProperties();
        properties.setEnabled(enabled);
        properties.setMaxRows(500);
        return properties;
    }

    private static SlsLogQueryReq request(long from, long to) {
        SlsLogQueryReq request = new SlsLogQueryReq();
        request.setFromTime(from);
        request.setToTime(to);
        request.setLine(100);
        return request;
    }

    @SuppressWarnings("unchecked")
    private static ObjectProvider<Client> emptyClientProvider() {
        return Mockito.mock(ObjectProvider.class);
    }
}
