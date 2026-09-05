SET @course_id := (SELECT course_id FROM sys_course_detail WHERE stage_name IS NOT NULL AND stage_name <> '' ORDER BY course_id,id LIMIT 1);
SET @stage_name := (SELECT stage_name FROM sys_course_detail WHERE course_id=@course_id AND stage_name IS NOT NULL AND stage_name <> '' ORDER BY id LIMIT 1);

INSERT INTO exam_question(question_type,question_content,answer_content,analysis_content,difficulty,status,created_at,updated_at)
SELECT 'SINGLE','Java 中用于创建对象实例的关键字是？','B','new 关键字用于调用构造方法并创建对象。','EASY','ENABLED',NOW(),NOW()
WHERE NOT EXISTS(SELECT 1 FROM exam_question WHERE question_content='Java 中用于创建对象实例的关键字是？');
SET @q1 := (SELECT id FROM exam_question WHERE question_content='Java 中用于创建对象实例的关键字是？' ORDER BY id LIMIT 1);
INSERT IGNORE INTO exam_question_option(question_id,option_key,option_content,sort_order,created_at,updated_at) VALUES
(@q1,'A','class',0,NOW(),NOW()),(@q1,'B','new',1,NOW(),NOW()),(@q1,'C','this',2,NOW(),NOW()),(@q1,'D','static',3,NOW(),NOW());

INSERT INTO exam_question(question_type,question_content,answer_content,analysis_content,difficulty,status,created_at,updated_at)
SELECT 'SINGLE','Spring Boot 应用常用的启动注解是？','C','@SpringBootApplication 是组合启动注解。','NORMAL','ENABLED',NOW(),NOW()
WHERE NOT EXISTS(SELECT 1 FROM exam_question WHERE question_content='Spring Boot 应用常用的启动注解是？');
SET @q2 := (SELECT id FROM exam_question WHERE question_content='Spring Boot 应用常用的启动注解是？' ORDER BY id LIMIT 1);
INSERT IGNORE INTO exam_question_option(question_id,option_key,option_content,sort_order,created_at,updated_at) VALUES
(@q2,'A','@Service',0,NOW(),NOW()),(@q2,'B','@Component',1,NOW(),NOW()),(@q2,'C','@SpringBootApplication',2,NOW(),NOW()),(@q2,'D','@Mapper',3,NOW(),NOW());

INSERT INTO exam_question(question_type,question_content,answer_content,analysis_content,difficulty,status,created_at,updated_at)
SELECT 'MULTIPLE','下面哪些属于 Java 集合接口？','A,B,D','List、Set、Map 都属于 Java 集合体系中的核心接口。','NORMAL','ENABLED',NOW(),NOW()
WHERE NOT EXISTS(SELECT 1 FROM exam_question WHERE question_content='下面哪些属于 Java 集合接口？');
SET @q3 := (SELECT id FROM exam_question WHERE question_content='下面哪些属于 Java 集合接口？' ORDER BY id LIMIT 1);
INSERT IGNORE INTO exam_question_option(question_id,option_key,option_content,sort_order,created_at,updated_at) VALUES
(@q3,'A','List',0,NOW(),NOW()),(@q3,'B','Set',1,NOW(),NOW()),(@q3,'C','Thread',2,NOW(),NOW()),(@q3,'D','Map',3,NOW(),NOW());

INSERT INTO exam_question(question_type,question_content,answer_content,analysis_content,difficulty,status,created_at,updated_at)
SELECT 'MULTIPLE','Spring 中常见的依赖注入方式有哪些？','A,B,C','构造器、Setter 和字段注入都可以完成依赖注入。','HARD','ENABLED',NOW(),NOW()
WHERE NOT EXISTS(SELECT 1 FROM exam_question WHERE question_content='Spring 中常见的依赖注入方式有哪些？');
SET @q4 := (SELECT id FROM exam_question WHERE question_content='Spring 中常见的依赖注入方式有哪些？' ORDER BY id LIMIT 1);
INSERT IGNORE INTO exam_question_option(question_id,option_key,option_content,sort_order,created_at,updated_at) VALUES
(@q4,'A','构造器注入',0,NOW(),NOW()),(@q4,'B','Setter 注入',1,NOW(),NOW()),(@q4,'C','字段注入',2,NOW(),NOW()),(@q4,'D','SQL 注入',3,NOW(),NOW());

INSERT INTO exam_question(question_type,question_content,answer_content,analysis_content,difficulty,status,created_at,updated_at)
SELECT 'JUDGE','Java 中 String 对象是不可变对象。','TRUE','String 创建后其内部字符序列不可修改。','EASY','ENABLED',NOW(),NOW()
WHERE NOT EXISTS(SELECT 1 FROM exam_question WHERE question_content='Java 中 String 对象是不可变对象。');
SET @q5 := (SELECT id FROM exam_question WHERE question_content='Java 中 String 对象是不可变对象。' ORDER BY id LIMIT 1);

INSERT INTO exam_question(question_type,question_content,answer_content,analysis_content,difficulty,status,created_at,updated_at)
SELECT 'FILL','Spring MVC 中接收 JSON 请求体通常使用 ______ 注解。','@RequestBody','@RequestBody 会将请求体反序列化为 Java 对象。','EASY','ENABLED',NOW(),NOW()
WHERE NOT EXISTS(SELECT 1 FROM exam_question WHERE question_content='Spring MVC 中接收 JSON 请求体通常使用 ______ 注解。');
SET @q6 := (SELECT id FROM exam_question WHERE question_content='Spring MVC 中接收 JSON 请求体通常使用 ______ 注解。' ORDER BY id LIMIT 1);

INSERT INTO exam_question(question_type,question_content,answer_content,analysis_content,difficulty,status,created_at,updated_at)
SELECT 'SHORT','请简述数据库事务的 ACID 特性。','原子性、一致性、隔离性、持久性。','回答应说明四个特性的基本含义。','NORMAL','ENABLED',NOW(),NOW()
WHERE NOT EXISTS(SELECT 1 FROM exam_question WHERE question_content='请简述数据库事务的 ACID 特性。');
SET @q7 := (SELECT id FROM exam_question WHERE question_content='请简述数据库事务的 ACID 特性。' ORDER BY id LIMIT 1);

INSERT INTO exam_question(question_type,question_content,answer_content,analysis_content,difficulty,status,created_at,updated_at)
SELECT 'PROGRAMMING','编写一个 Java 方法，返回整数数组中的最大值。','public int max(int[] nums) { int max = nums[0]; for (int n : nums) { if (n > max) max = n; } return max; }','遍历数组并维护当前最大值，时间复杂度 O(n)。','HARD','ENABLED',NOW(),NOW()
WHERE NOT EXISTS(SELECT 1 FROM exam_question WHERE question_content='编写一个 Java 方法，返回整数数组中的最大值。');
SET @q8 := (SELECT id FROM exam_question WHERE question_content='编写一个 Java 方法，返回整数数组中的最大值。' ORDER BY id LIMIT 1);

INSERT IGNORE INTO exam_question_course(question_id,course_id,stage_name,created_at)
SELECT id,@course_id,@stage_name,NOW() FROM exam_question WHERE id IN (@q1,@q2,@q3,@q4,@q5,@q6,@q7,@q8) AND @course_id IS NOT NULL;
