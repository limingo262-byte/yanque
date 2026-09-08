package cn.yanque.modules.ops.controller;

import cn.yanque.commons.apires.ApiResponse;
import cn.yanque.modules.ops.pojo.vo.reqvo.SlsLogQueryReq;
import cn.yanque.modules.ops.pojo.vo.resvo.SlsLogQueryRes;
import cn.yanque.modules.ops.service.SlsLogQueryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Authenticated admin operations endpoints. The internal alias is protected by BearMcpRequestUtils. */
@RestController
@RequestMapping({"/api/ops/logs", "/internal/ops/logs"})
public class SlsLogController {
    private final SlsLogQueryService service;

    public SlsLogController(SlsLogQueryService service) {
        this.service = service;
    }

    @PostMapping("/query")
    public ApiResponse<SlsLogQueryRes> query(@Valid @RequestBody SlsLogQueryReq req) {
        return ApiResponse.success(service.query(req));
    }
}
