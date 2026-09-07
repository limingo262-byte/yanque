package cn.yanque.modules.ops.pojo.vo.resvo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlsLogItemRes {
    private long timestamp;
    private String source;
    private Map<String, String> fields = new LinkedHashMap<>();
}
