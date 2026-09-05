# 学生指标口径

- 学生人数：`COUNT(student.id)`，按班级统计时使用 `class_id` 分组。
- 班级学生人数：`student` 左连接 `sys_class`，按班级名称分组。
