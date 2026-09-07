# 学生指标口径

- 学生人数：`COUNT(student.id)`，按班级统计时使用 `student.class_id` 分组。
- 班级学生人数：`sys_class` 左连接 `student`，使用 `sys_class.class_period` 作为班级名称，按班级期数分组；不要使用不存在的 `sys_class.name`。
