# 学生业务规则

学生查询属于 student 业务域。学生基础信息使用 `student`，学生姓名字段是 `student.student_name`；班级信息使用 `sys_class`，班级名称/期数字段是 `sys_class.class_period`，不存在 `sys_class.name`。
班级统计通过 `student.class_id = sys_class.id` 关联；明细查询默认最多返回 100 行。
