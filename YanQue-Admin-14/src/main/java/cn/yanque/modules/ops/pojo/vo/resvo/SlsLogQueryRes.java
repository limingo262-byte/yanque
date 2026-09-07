package cn.yanque.modules.ops.pojo.vo.resvo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlsLogQueryRes {
    private List<SlsLogItemRes> records;
    private long elapsedMs;
    private boolean completed;
    private boolean analysisQuery;
    private int returnedCount;
}
