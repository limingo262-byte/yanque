package cn.yanque.commons.utils;

import cn.hutool.core.util.StrUtil;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Set;

public final class BearMcpRequestUtils {
    public static final String HEADER = "X-Bear-Mcp-Request";
    public static final String TOKEN_HEADER = "X-Bear-Mcp-Token";

    private static final Set<String> LOOPBACK_ADDRESSES = Set.of("127.0.0.1", "0:0:0:0:0:0:0:1", "::1");
    private static final String INTERNAL_TOKEN = System.getenv("YANQUE_INTERNAL_TOKEN");

    private BearMcpRequestUtils() {
    }

    public static boolean isTrustedBearMcpRequest(HttpServletRequest request) {
        String marker = request.getHeader(HEADER);
        if (!"true".equalsIgnoreCase(StrUtil.trim(marker))) {
            return false;
        }
        if (LOOPBACK_ADDRESSES.contains(request.getRemoteAddr())) {
            return true;
        }
        return StrUtil.isNotBlank(INTERNAL_TOKEN)
                && INTERNAL_TOKEN.equals(request.getHeader(TOKEN_HEADER));
    }
}
