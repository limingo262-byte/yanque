package cn.yanque.modules.ops.pojo.vo.reqvo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Query options accepted by the operations log endpoint. Times are Unix seconds. */
@Data
public class SlsLogQueryReq {
    @NotNull(message = "开始时间不能为空")
    private Long fromTime;

    @NotNull(message = "结束时间不能为空")
    private Long toTime;

    @Size(max = 1000, message = "关键词或查询语句不能超过1000个字符")
    private String keyword;

    @Size(max = 4000, message = "查询语句不能超过4000个字符")
    private String query;

    @Size(max = 100, message = "服务名称不能超过100个字符")
    private String service;

    @Min(value = 1, message = "返回条数必须大于0")
    @Max(value = 500, message = "返回条数不能超过500")
    private Integer line = 100;
}
