/*
SQLyog Ultimate v8.32 
MySQL - 8.0.28 : Database - yanque-13
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`yanque-13` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `yanque-13`;

/*Table structure for table `course_homework_template` */

DROP TABLE IF EXISTS `course_homework_template`;

CREATE TABLE `course_homework_template` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '课程作业标准ID',
  `course_id` bigint NOT NULL COMMENT '课程ID',
  `teaching_mode` varchar(20) NOT NULL COMMENT '上课方式：ONLINE线上，OFFLINE线下',
  `stage_name` varchar(64) DEFAULT NULL COMMENT '阶段名称，线上课程使用',
  `day_number` int DEFAULT NULL COMMENT '第几天，线下课程使用',
  `content_object_key` varchar(500) NOT NULL COMMENT '作业标准文档对象Key',
  `content_file_name` varchar(255) NOT NULL COMMENT '作业标准文档文件名',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE生效，INACTIVE失效',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_course_stage` (`course_id`,`teaching_mode`,`stage_name`),
  UNIQUE KEY `uk_course_day` (`course_id`,`teaching_mode`,`day_number`),
  KEY `idx_course_homework_template_course` (`course_id`),
  KEY `idx_course_homework_template_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='课程作业标准/训练集表';

/*Data for the table `course_homework_template` */

insert  into `course_homework_template`(`id`,`course_id`,`teaching_mode`,`stage_name`,`day_number`,`content_object_key`,`content_file_name`,`status`,`remark`,`created_at`,`updated_at`) values (2,1,'OFFLINE',NULL,1,'course/homework-template/1/20260617/bb42dce8-2c49-4f1d-a3f9-6324857d77a0.md','agent面试题.md','ACTIVE',NULL,'2026-06-17 01:19:02','2026-06-17 01:19:02'),(4,1,'OFFLINE',NULL,2,'course/homework-template/1/20260617/47924f38-9a16-4a75-9186-6d6e1fc1a418.md','作业测试.md','ACTIVE',NULL,'2026-06-17 14:16:22','2026-06-17 14:16:22'),(5,1,'OFFLINE',NULL,3,'course/homework-template/1/20260617/b81c6960-012d-4e45-91d9-274a19c3469b.md','作业测试.md','ACTIVE',NULL,'2026-06-17 14:19:00','2026-06-17 14:19:00'),(6,1,'OFFLINE',NULL,4,'course/homework-template/1/20260617/1af547cd-c515-49af-acc6-e2233e3ad752.md','作业测试.md','ACTIVE',NULL,'2026-06-17 14:20:05','2026-06-17 14:20:05'),(7,7,'OFFLINE',NULL,1,'course/homework-template/7/20260722/f9673175-7772-4d4a-af57-881b256b6396.md','作业信息.md','INACTIVE','这是刚才些的上传md文档. 到osss, 还要落库.111','2026-07-22 16:17:27','2026-07-22 16:21:47');

/*Table structure for table `dorm_assignment` */

DROP TABLE IF EXISTS `dorm_assignment`;

CREATE TABLE `dorm_assignment` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '入住记录ID',
  `student_id` bigint NOT NULL COMMENT '学生ID（student.id）',
  `bed_id` bigint NOT NULL COMMENT '床位ID（dorm_bed.id）',
  `room_id` bigint NOT NULL COMMENT '房间ID（冗余，便于查询）',
  `building_id` bigint NOT NULL COMMENT '楼栋ID（冗余，便于查询）',
  `check_in_date` date NOT NULL COMMENT '入住日期',
  `check_out_date` date DEFAULT NULL COMMENT '退宿日期，在住时为null',
  `status` varchar(20) NOT NULL DEFAULT 'LIVING' COMMENT '状态：LIVING在住/CHECKED_OUT已退宿',
  `assigned_by` bigint NOT NULL COMMENT '分配操作人（管理端用户ID）',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_bed_id` (`bed_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='宿舍入住记录表';

/*Data for the table `dorm_assignment` */

/*Table structure for table `dorm_bed` */

DROP TABLE IF EXISTS `dorm_bed`;

CREATE TABLE `dorm_bed` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '床位ID',
  `room_id` bigint NOT NULL COMMENT '所属房间ID（dorm_room.id）',
  `bed_no` varchar(16) NOT NULL COMMENT '床位号，如"A"或"1"',
  `status` varchar(20) NOT NULL DEFAULT 'FREE' COMMENT '状态：FREE空闲/OCCUPIED占用/LOCKED锁定',
  `current_student_id` bigint DEFAULT NULL COMMENT '当前入住学生ID（student.id），空闲时为null',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_room_bed` (`room_id`,`bed_no`),
  KEY `idx_room_id` (`room_id`),
  KEY `idx_current_student_id` (`current_student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='宿舍床位表';

/*Data for the table `dorm_bed` */

insert  into `dorm_bed`(`id`,`room_id`,`bed_no`,`status`,`current_student_id`,`created_at`,`updated_at`) values (1,1,'1','FREE',NULL,'2026-06-26 18:45:22','2026-06-26 18:45:22'),(2,1,'2','FREE',NULL,'2026-06-26 18:45:22','2026-06-26 18:45:22'),(3,2,'1','FREE',NULL,'2026-06-26 18:45:22','2026-06-26 18:45:22');

/*Table structure for table `dorm_building` */

DROP TABLE IF EXISTS `dorm_building`;

CREATE TABLE `dorm_building` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '楼栋ID',
  `campus_id` bigint NOT NULL COMMENT '所属校区ID（sys_campus.id）',
  `building_name` varchar(64) NOT NULL COMMENT '楼栋名称，如"1号楼"',
  `gender_type` varchar(10) NOT NULL COMMENT '性别类型：MALE男寝/FEMALE女寝',
  `manager_name` varchar(32) DEFAULT NULL COMMENT '宿管姓名',
  `manager_phone` varchar(20) DEFAULT NULL COMMENT '宿管电话',
  `status` varchar(20) NOT NULL DEFAULT 'ENABLED' COMMENT '状态：ENABLED启用/DISABLED停用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_campus_id` (`campus_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='宿舍楼栋表';

/*Data for the table `dorm_building` */

insert  into `dorm_building`(`id`,`campus_id`,`building_name`,`gender_type`,`manager_name`,`manager_phone`,`status`,`created_at`,`updated_at`) values (1,1,'第一宿舍楼','MALE',NULL,NULL,'ENABLED','2026-06-26 18:44:50','2026-06-26 18:44:50'),(2,1,'第二宿舍楼','FEMALE',NULL,NULL,'ENABLED','2026-06-26 18:44:50','2026-06-26 18:44:50');

/*Table structure for table `dorm_room` */

DROP TABLE IF EXISTS `dorm_room`;

CREATE TABLE `dorm_room` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '房间ID',
  `building_id` bigint NOT NULL COMMENT '所属楼栋ID（dorm_building.id）',
  `room_no` varchar(32) NOT NULL COMMENT '房间号，如"301"',
  `floor` int NOT NULL DEFAULT '1' COMMENT '楼层',
  `capacity` int NOT NULL COMMENT '床位容量',
  `room_type` varchar(20) DEFAULT NULL COMMENT '房型：FOUR四人间/SIX六人间等',
  `status` varchar(20) NOT NULL DEFAULT 'ENABLED' COMMENT '状态：ENABLED启用/DISABLED停用/MAINTENANCE维修',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_building_room` (`building_id`,`room_no`),
  KEY `idx_building_id` (`building_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='宿舍房间表';

/*Data for the table `dorm_room` */

insert  into `dorm_room`(`id`,`building_id`,`room_no`,`floor`,`capacity`,`room_type`,`status`,`created_at`,`updated_at`) values (1,1,'101',1,6,NULL,'ENABLED','2026-06-26 18:45:11','2026-06-26 18:45:11'),(2,1,'102',1,6,NULL,'ENABLED','2026-06-26 18:45:11','2026-06-26 18:45:11');

/*Table structure for table `exam` */

DROP TABLE IF EXISTS `exam`;

CREATE TABLE `exam` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '考试ID',
  `paper_id` bigint NOT NULL COMMENT '试卷ID',
  `class_id` bigint NOT NULL COMMENT '班级ID',
  `start_time` datetime NOT NULL COMMENT '可进入考试开始时间',
  `end_time` datetime NOT NULL COMMENT '可进入考试截止时间',
  `duration_minutes` int NOT NULL COMMENT '学生个人答题时长，单位分钟',
  `invigilator_user_id` mediumtext NOT NULL COMMENT '监考老师',
  `answer_visible` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否向学生公布答卷判定结果',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_paper` (`paper_id`),
  KEY `idx_exam_class_time` (`class_id`,`start_time`,`end_time`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='考试安排表';

/*Data for the table `exam` */

insert  into `exam`(`id`,`paper_id`,`class_id`,`start_time`,`end_time`,`duration_minutes`,`invigilator_user_id`,`answer_visible`,`created_at`,`updated_at`) values (1,1,4,'2026-06-16 11:00:00','2026-06-16 12:00:00',30,'11',1,'2026-06-16 10:44:29','2026-06-16 14:52:27'),(2,2,4,'2026-06-16 15:00:00','2026-06-16 16:00:00',60,'9',1,'2026-06-16 14:59:55','2026-06-16 15:09:29'),(3,3,1,'2026-06-26 15:00:00','2026-06-26 16:00:00',60,'29',1,'2026-06-26 15:46:18','2026-06-26 15:48:14');

/*Table structure for table `exam_paper` */

DROP TABLE IF EXISTS `exam_paper`;

CREATE TABLE `exam_paper` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
  `paper_name` varchar(128) NOT NULL COMMENT '试卷名称',
  `course_id` bigint NOT NULL COMMENT '课程ID',
  `stage_name` varchar(64) DEFAULT NULL COMMENT '阶段名称，为空表示整门课程考试',
  `total_score` decimal(10,1) NOT NULL COMMENT '总分数',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_paper_course_stage` (`course_id`,`stage_name`),
  KEY `idx_exam_paper_name` (`paper_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='试卷表';

/*Data for the table `exam_paper` */

insert  into `exam_paper`(`id`,`paper_name`,`course_id`,`stage_name`,`total_score`,`created_at`,`updated_at`) values (1,'JAVA-AI  测试卷',1,NULL,'100.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(2,'JAVA-AI  测试卷1',1,NULL,'100.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(3,'JAVA-AI 测试卷2',1,'SPRING','100.0','2026-06-26 15:44:07','2026-06-26 15:44:07');

/*Table structure for table `exam_paper_question` */

DROP TABLE IF EXISTS `exam_paper_question`;

CREATE TABLE `exam_paper_question` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `paper_id` bigint NOT NULL COMMENT '试卷ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `question_score` decimal(10,1) NOT NULL COMMENT '题目分数',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_paper_question` (`paper_id`,`question_id`),
  KEY `idx_exam_paper_question_paper` (`paper_id`),
  KEY `idx_exam_paper_question_question` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='试卷题目关联表';

/*Data for the table `exam_paper_question` */

insert  into `exam_paper_question`(`id`,`paper_id`,`question_id`,`question_score`,`created_at`,`updated_at`) values (1,1,76,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(2,1,75,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(3,1,74,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(4,1,73,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(5,1,72,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(6,1,42,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(7,1,41,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(8,1,40,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(9,1,39,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(10,1,38,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(11,1,37,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(12,1,8,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(13,1,7,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(14,1,6,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(15,1,5,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(16,1,4,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(17,1,3,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(18,1,2,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(19,1,160,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(20,1,95,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(21,1,94,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(22,1,93,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(23,1,92,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(24,1,91,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(25,1,90,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(26,1,89,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(27,1,88,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(28,1,87,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(29,1,86,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(30,1,85,'2.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(31,1,155,'10.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(32,1,154,'10.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(33,1,153,'10.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(34,1,152,'10.0','2026-06-16 09:54:44','2026-06-16 09:54:44'),(35,2,76,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(36,2,75,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(37,2,74,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(38,2,73,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(39,2,72,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(40,2,42,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(41,2,41,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(42,2,40,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(43,2,39,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(44,2,38,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(45,2,37,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(46,2,8,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(47,2,7,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(48,2,6,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(49,2,5,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(50,2,4,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(51,2,3,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(52,2,2,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(53,2,101,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(54,2,100,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(55,2,99,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(56,2,98,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(57,2,97,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(58,2,96,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(59,2,71,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(60,2,70,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(61,2,69,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(62,2,68,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(63,2,67,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(64,2,66,'2.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(65,2,158,'10.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(66,2,157,'10.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(67,2,156,'10.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(68,2,148,'10.0','2026-06-16 14:57:38','2026-06-16 14:57:38'),(69,3,42,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(70,3,41,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(71,3,40,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(72,3,39,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(73,3,38,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(74,3,37,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(75,3,160,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(76,3,63,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(77,3,62,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(78,3,61,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(79,3,60,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(80,3,59,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(81,3,58,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(82,3,57,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(83,3,56,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(84,3,55,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(85,3,71,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(86,3,70,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(87,3,69,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(88,3,68,'2.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(89,3,140,'10.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(90,3,139,'20.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(91,3,148,'20.0','2026-06-26 15:44:07','2026-06-26 15:44:07'),(92,3,147,'10.0','2026-06-26 15:44:07','2026-06-26 15:44:07');

/*Table structure for table `exam_question` */

DROP TABLE IF EXISTS `exam_question`;

CREATE TABLE `exam_question` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question_type` varchar(32) NOT NULL COMMENT '题目类型：SINGLE单选，MULTIPLE多选，JUDGE判断，FILL填空，SHORT简答',
  `question_content` text NOT NULL COMMENT '题干',
  `answer_content` text NOT NULL COMMENT '正确答案',
  `analysis_content` text COMMENT '答案解析',
  `difficulty` varchar(32) NOT NULL DEFAULT 'NORMAL' COMMENT '难度：EASY简单，NORMAL普通，HARD困难',
  `status` varchar(32) NOT NULL DEFAULT 'ENABLED' COMMENT '状态：ENABLED启用，DISABLED停用',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_question_type` (`question_type`),
  KEY `idx_exam_question_status` (`status`),
  KEY `idx_exam_question_difficulty` (`difficulty`)
) ENGINE=InnoDB AUTO_INCREMENT=162 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='题库题目表';

/*Data for the table `exam_question` */

insert  into `exam_question`(`id`,`question_type`,`question_content`,`answer_content`,`analysis_content`,`difficulty`,`status`,`created_at`,`updated_at`) values (1,'SINGLE','哈哈哈哈','A','就是xxx','NORMAL','ENABLED','2026-06-15 23:54:40','2026-06-15 23:54:40'),(2,'SINGLE','Java中用于定义类的关键字是？','A','class用于声明类，是Java面向对象程序的基本结构。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(3,'SINGLE','Java程序的入口方法通常是？','B','public static void main(String[] args) 是Java应用程序常见入口。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(4,'SINGLE','下面哪个类型用于表示整数？','A','int是Java中常用的整数基本类型。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(5,'SINGLE','下面哪个类型用于表示真假值？','C','boolean用于表示true或false。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(6,'SINGLE','Java中字符串常用的引用类型是？','D','String用于表示字符串对象。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(7,'SINGLE','下面哪个符号用于单行注释？','A','Java中双斜杠用于单行注释。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(8,'SINGLE','下面哪个关键字用于创建对象？','B','new用于创建对象实例。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(9,'SINGLE','Java中数组下标从几开始？','A','Java数组下标从0开始。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(10,'SINGLE','下面哪个访问修饰符表示同包和子类可访问？','C','protected允许同包类和子类访问。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(11,'SINGLE','private修饰的成员主要表示什么？','B','private限制成员只在当前类内部访问。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(12,'SINGLE','Java中用于继承类的关键字是？','D','extends用于类继承。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(13,'SINGLE','Java中用于实现接口的关键字是？','A','implements用于类实现接口。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(14,'SINGLE','下面哪个集合允许元素按索引访问？','B','List支持按索引访问元素。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(15,'SINGLE','HashMap主要存储什么结构的数据？','C','HashMap以键值对形式存储数据。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(16,'SINGLE','下面哪个集合不允许重复元素？','A','Set集合语义是不允许重复元素。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(17,'SINGLE','Java异常处理中用于捕获异常的关键字是？','B','catch用于捕获try块抛出的异常。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(18,'SINGLE','finally代码块的特点通常是？','D','finally通常用于释放资源，在异常处理流程结束前执行。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(19,'SINGLE','面向对象三大特征不包括下面哪一项？','C','常见三大特征是封装、继承、多态，不包括编译。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(20,'SINGLE','方法重载主要看什么不同？','A','方法重载要求方法名相同但参数列表不同。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(21,'SINGLE','方法重写通常发生在什么关系中？','B','重写通常发生在父子类继承关系中。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(22,'SINGLE','static修饰的方法属于谁？','C','static成员属于类本身，而不是某个对象实例。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(23,'SINGLE','final修饰变量时通常表示什么？','A','final变量赋值后不可再次修改引用或基本值。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(24,'SINGLE','接口中的抽象方法默认具有什么访问级别？','D','接口抽象方法默认是public abstract。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(25,'SINGLE','下面哪个关键字用于判断对象类型？','B','instanceof用于判断对象是否属于某个类型。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(26,'SINGLE','StringBuilder相比String更适合哪种场景？','A','大量字符串拼接时StringBuilder可减少中间对象。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(27,'SINGLE','Java中包声明使用哪个关键字？','C','package用于声明当前类所在包。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(28,'SINGLE','Java中导入其他包类使用哪个关键字？','D','import用于导入其他包中的类。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(29,'SINGLE','构造方法的名称必须和什么一致？','B','构造方法名称必须和类名一致。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(30,'SINGLE','抽象类使用哪个关键字声明？','A','abstract可用于声明抽象类或抽象方法。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(31,'SINGLE','Java中所有类默认直接或间接继承哪个类？','C','Object是Java类层次结构的根类。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(32,'SINGLE','HashMap查询平均时间复杂度通常认为是？','B','哈希分布良好时HashMap查询平均复杂度接近O(1)。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(33,'SINGLE','ArrayList底层主要基于什么实现？','A','ArrayList底层主要使用数组存储元素。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(34,'SINGLE','LinkedList更适合哪类操作场景？','C','LinkedList在已定位节点附近插入删除较方便。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(35,'SINGLE','Java中 == 比较引用类型时主要比较什么？','D','引用类型使用==比较的是引用地址是否相同。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(36,'SINGLE','equals方法默认来自Object时比较什么？','A','Object默认equals与==类似，比较对象引用。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(37,'SINGLE','Spring中用于声明组件类的常用注解是？','A','@Component用于声明Spring容器管理的组件。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(38,'SINGLE','Spring MVC中声明控制器常用注解是？','B','@RestController常用于声明REST接口控制器。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(39,'SINGLE','Spring中声明业务服务类常用注解是？','C','@Service通常用于标识业务服务组件。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(40,'SINGLE','Spring Boot启动类通常使用哪个注解？','D','@SpringBootApplication是Spring Boot启动类常用组合注解。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(41,'SINGLE','下面哪个注解用于GET请求映射？','A','@GetMapping用于处理HTTP GET请求。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(42,'SINGLE','下面哪个注解用于POST请求映射？','B','@PostMapping用于处理HTTP POST请求。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(43,'SINGLE','@RequestBody主要用于接收什么数据？','C','@RequestBody通常将请求体JSON反序列化为对象。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(44,'SINGLE','@PathVariable主要用于接收什么参数？','A','@PathVariable用于接收URL路径中的变量。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(45,'SINGLE','@RequestParam主要用于接收什么参数？','D','@RequestParam常用于接收URL查询参数或表单参数。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(46,'SINGLE','Spring容器管理对象通常称为什么？','B','被Spring容器管理的对象通常称为Bean。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(47,'SINGLE','依赖注入的主要目的是什么？','C','依赖注入用于降低对象创建和依赖管理的耦合。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(48,'SINGLE','@Autowired默认按什么注入依赖？','A','@Autowired通常按类型完成依赖注入。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(49,'SINGLE','@Configuration通常表示什么？','D','@Configuration表示配置类，常用于声明Bean配置。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(50,'SINGLE','@Bean通常写在什么类中？','B','@Bean通常写在配置类中，用于向容器注册对象。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(51,'SINGLE','Spring中@Transactional主要用于什么？','C','@Transactional用于声明事务边界。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(52,'SINGLE','MyBatis中Mapper接口主要负责什么？','A','Mapper接口用于定义数据库访问方法。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(53,'SINGLE','MyBatis XML中select标签通常用于什么？','B','select标签用于定义查询SQL。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(54,'SINGLE','PageHelper.startPage应放在什么位置？','C','PageHelper应紧跟在主分页查询之前调用。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(55,'SINGLE','REST接口中PUT通常表示什么操作？','D','PUT通常用于更新资源。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(56,'SINGLE','REST接口中DELETE通常表示什么操作？','A','DELETE通常用于删除资源。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(57,'SINGLE','统一响应对象的好处是什么？','B','统一响应可让前端稳定处理code、message和data。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(58,'SINGLE','参数校验中@NotBlank主要用于校验什么？','C','@NotBlank用于校验字符串不为null且去空白后不为空。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(59,'SINGLE','参数校验中@NotNull主要用于校验什么？','D','@NotNull用于校验对象不能为null。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(60,'SINGLE','Controller层最适合承担什么职责？','A','Controller适合处理HTTP入口、参数校验和DTO边界。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(61,'SINGLE','Service层通常不应该直接依赖什么？','B','领域Service通常应避免直接依赖Controller请求DTO。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(62,'SINGLE','Mapper XML中的where标签有什么作用？','C','where标签可帮助动态SQL处理多余的and。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(63,'SINGLE','Spring Boot配置文件常见名称是？','D','application.yaml或application.properties是常见配置文件。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(64,'SINGLE','AOP主要适合处理哪类逻辑？','A','AOP适合日志、权限、事务等横切关注点。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(65,'SINGLE','拦截器Interceptor常用于什么场景？','B','拦截器常用于登录校验、权限校验、签名校验等请求前后处理。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(66,'SINGLE','Spring事务默认对哪类异常更容易触发回滚？','C','Spring声明式事务默认对运行时异常和Error回滚。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(67,'SINGLE','MyBatis中resultMap主要解决什么问题？','D','resultMap用于定义列名和对象属性之间的映射。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(68,'SINGLE','避免列表SQL复杂join的一种做法是什么？','A','先查主表再批量查询关联数据，可降低分页和SQL复杂度。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(69,'SINGLE','接口幂等通常关注什么？','B','幂等关注同一请求重复执行不会造成重复副作用。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(70,'SINGLE','权限校验中AntPathMatcher适合做什么？','C','AntPathMatcher可用于匹配带通配或路径变量的接口路径。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(71,'SINGLE','HMAC签名校验主要用于防止什么问题？','D','HMAC签名可帮助校验请求未被篡改并来自可信客户端。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(72,'SINGLE','人工智能中AI通常指什么？','A','AI是Artificial Intelligence的缩写，表示人工智能。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(73,'SINGLE','机器学习主要让计算机从什么中学习规律？','B','机器学习通过数据和经验学习规律。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(74,'SINGLE','监督学习通常需要什么数据？','C','监督学习通常需要带标签的数据。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(75,'SINGLE','分类任务的输出通常是什么？','D','分类任务输出离散类别。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(76,'SINGLE','回归任务的输出通常是什么？','A','回归任务通常预测连续数值。','EASY','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(77,'SINGLE','训练集主要用于什么？','B','训练集用于让模型学习参数和规律。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(78,'SINGLE','测试集主要用于什么？','C','测试集用于评估模型在未见数据上的效果。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(79,'SINGLE','过拟合通常表示什么？','D','过拟合表示模型过度记住训练数据，泛化能力较差。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(80,'SINGLE','欠拟合通常表示什么？','A','欠拟合表示模型能力不足，训练数据都学不好。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(81,'SINGLE','特征工程主要关注什么？','B','特征工程关注从原始数据构造更有效的输入特征。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(82,'SINGLE','向量化表示的核心作用是什么？','C','向量化把文本、图片等数据转为模型可计算的数值向量。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(83,'SINGLE','Embedding通常表示什么？','D','Embedding是把对象映射到低维或稠密向量空间的表示。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(84,'SINGLE','大语言模型常用于什么任务？','A','大语言模型常用于文本生成、问答、摘要等语言任务。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(85,'SINGLE','Prompt在大模型使用中主要是什么？','B','Prompt是提供给模型的指令、问题或上下文。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(86,'SINGLE','RAG中的检索步骤主要做什么？','C','RAG先从知识库检索相关内容，再辅助生成回答。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(87,'SINGLE','向量数据库常用于支持什么能力？','D','向量数据库常用于相似度检索。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(88,'SINGLE','余弦相似度通常用于衡量什么？','A','余弦相似度可衡量两个向量方向的相似程度。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(89,'SINGLE','模型评估中的准确率表示什么？','B','准确率表示预测正确样本占总样本的比例。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(90,'SINGLE','混淆矩阵常用于分析什么任务？','C','混淆矩阵常用于分类模型效果分析。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(91,'SINGLE','数据清洗主要解决什么问题？','D','数据清洗处理缺失、错误、重复等数据质量问题。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(92,'SINGLE','Token在大语言模型中通常指什么？','A','Token是模型处理文本时的基本片段单位。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(93,'SINGLE','上下文窗口限制影响什么？','B','上下文窗口限制模型一次可处理的输入和输出长度。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(94,'SINGLE','温度temperature参数通常影响什么？','C','temperature越高，生成结果通常越随机。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(95,'SINGLE','微调Fine-tuning主要指什么？','D','微调是在已有模型基础上用特定数据继续训练。','NORMAL','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(96,'SINGLE','梯度下降主要用于什么？','A','梯度下降用于通过优化损失函数来更新模型参数。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(97,'SINGLE','损失函数的作用是什么？','B','损失函数用于度量预测结果与真实结果的差距。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(98,'SINGLE','正则化常用于缓解什么问题？','C','正则化通过约束模型复杂度来缓解过拟合。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(99,'SINGLE','召回率更关注什么？','D','召回率关注真实正例中被正确找出的比例。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(100,'SINGLE','精确率更关注什么？','A','精确率关注预测为正的样本中真正为正的比例。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(101,'SINGLE','在RAG系统中，召回内容质量差最可能导致什么？','B','RAG依赖检索内容，召回质量差会影响生成答案质量。','HARD','ENABLED','2026-06-16 00:21:44','2026-06-16 00:21:44'),(129,'PROGRAMMING','编写一个Java方法，接收两个int参数，返回它们的和。','public int add(int a, int b) {\n    return a + b;\n}','考查方法定义、参数和返回值。','EASY','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(130,'PROGRAMMING','编写一个Java方法，判断一个整数是否为偶数。','public boolean isEven(int num) {\n    return num % 2 == 0;\n}','考查取模运算和boolean返回值。','EASY','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(131,'PROGRAMMING','编写一个Java方法，接收一个int数组，返回数组元素之和。','public int sum(int[] nums) {\n    int total = 0;\n    for (int num : nums) {\n        total += num;\n    }\n    return total;\n}','考查数组遍历和累加。','EASY','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(132,'PROGRAMMING','编写一个Java方法，接收一个int数组，返回最大值。如果数组为空，返回0。','public int max(int[] nums) {\n    if (nums == null || nums.length == 0) {\n        return 0;\n    }\n    int max = nums[0];\n    for (int num : nums) {\n        if (num > max) {\n            max = num;\n        }\n    }\n    return max;\n}','考查边界判断、数组遍历和最大值更新。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(133,'PROGRAMMING','编写一个Java方法，反转字符串。例如输入abc，返回cba。','public String reverse(String text) {\n    if (text == null) {\n        return null;\n    }\n    return new StringBuilder(text).reverse().toString();\n}','考查StringBuilder和空值处理。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(134,'PROGRAMMING','编写一个Java方法，统计字符串中字符a出现的次数。','public int countA(String text) {\n    if (text == null) {\n        return 0;\n    }\n    int count = 0;\n    for (int i = 0; i < text.length(); i++) {\n        if (text.charAt(i) == \'a\') {\n            count++;\n        }\n    }\n    return count;\n}','考查字符串遍历和计数。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(135,'PROGRAMMING','编写一个Java方法，判断一个字符串是否为回文字符串。','public boolean isPalindrome(String text) {\n    if (text == null) {\n        return false;\n    }\n    int left = 0;\n    int right = text.length() - 1;\n    while (left < right) {\n        if (text.charAt(left) != text.charAt(right)) {\n            return false;\n        }\n        left++;\n        right--;\n    }\n    return true;\n}','考查双指针思想。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(136,'PROGRAMMING','编写一个Java方法，接收List<Integer>，返回去重后的List，保持原有顺序。','public List<Integer> distinct(List<Integer> nums) {\n    if (nums == null) {\n        return List.of();\n    }\n    Set<Integer> seen = new LinkedHashSet<>(nums);\n    return new ArrayList<>(seen);\n}','考查集合去重和LinkedHashSet保持插入顺序。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(137,'PROGRAMMING','编写一个Java方法，统计字符串中每个字符出现的次数，返回Map<Character, Integer>。','public Map<Character, Integer> countChars(String text) {\n    Map<Character, Integer> result = new HashMap<>();\n    if (text == null) {\n        return result;\n    }\n    for (int i = 0; i < text.length(); i++) {\n        char ch = text.charAt(i);\n        result.put(ch, result.getOrDefault(ch, 0) + 1);\n    }\n    return result;\n}','考查HashMap统计频次。','HARD','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(138,'PROGRAMMING','编写一个Java方法，实现冒泡排序，返回升序排列后的数组。','public int[] bubbleSort(int[] nums) {\n    if (nums == null) {\n        return new int[0];\n    }\n    int[] arr = Arrays.copyOf(nums, nums.length);\n    for (int i = 0; i < arr.length - 1; i++) {\n        for (int j = 0; j < arr.length - 1 - i; j++) {\n            if (arr[j] > arr[j + 1]) {\n                int temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n    }\n    return arr;\n}','考查基础排序和数组拷贝。','HARD','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(139,'PROGRAMMING','编写一个Spring Boot Controller接口，GET /hello 返回字符串 hello。','@RestController\npublic class HelloController {\n    @GetMapping(\"/hello\")\n    public String hello() {\n        return \"hello\";\n    }\n}','考查@RestController和@GetMapping。','EASY','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(140,'PROGRAMMING','编写一个DTO类UserCreateReq，包含username和password字段，并要求两个字段不能为空。','public class UserCreateReq {\n    @NotBlank(message = \"用户名不能为空\")\n    private String username;\n\n    @NotBlank(message = \"密码不能为空\")\n    private String password;\n}','考查请求DTO和@NotBlank校验。','EASY','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(141,'PROGRAMMING','编写一个Controller方法，接收路径参数id，返回该id字符串。','@GetMapping(\"/users/{id}\")\npublic String getUserId(@PathVariable Long id) {\n    return String.valueOf(id);\n}','考查@PathVariable使用。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(142,'PROGRAMMING','编写一个Controller方法，接收请求体UserCreateReq，并返回成功响应。','@PostMapping(\"/users\")\npublic ApiResponse<Void> createUser(@Valid @RequestBody UserCreateReq req) {\n    return ApiResponse.success(null);\n}','考查@RequestBody、@Valid和统一响应。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(143,'PROGRAMMING','编写一个Service方法，判断用户名是否为空，为空时抛出BusinessException。','public void validateUsername(String username) {\n    if (!StringUtils.hasText(username)) {\n        throw BusinessException.ParamsError.newInstance(\"用户名不能为空\");\n    }\n}','考查业务校验和异常抛出。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(144,'PROGRAMMING','编写一个MyBatis Mapper接口方法，用于根据id查询用户。','public interface UserMapper {\n    UserEntity selectById(@Param(\"id\") Long id);\n}','考查Mapper接口和@Param。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(145,'PROGRAMMING','编写一段MyBatis XML查询，根据id查询sys_user表。','<select id=\"selectById\" resultMap=\"UserMap\">\n    select id, username, nickname, status\n    from sys_user\n    where id = #{id}\n</select>','考查MyBatis select XML写法。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(146,'PROGRAMMING','编写一个分页查询Service片段，使用PageHelper分页后查询主表。','int pageNum = req.getPageNum() == null ? 1 : req.getPageNum();\nint pageSize = req.getPageSize() == null ? 10 : req.getPageSize();\nPageHelper.startPage(pageNum, pageSize);\nList<UserEntity> list = userMapper.selectPage(query);\nPageInfo<UserEntity> pageInfo = new PageInfo<>(list);','考查PageHelper必须紧跟主查询。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(147,'PROGRAMMING','编写一个事务方法，创建订单并保存明细，任一失败时回滚。','@Transactional(rollbackFor = Exception.class)\npublic Long createOrder(OrderEntity order, List<OrderItemEntity> items) {\n    orderMapper.insert(order);\n    for (OrderItemEntity item : items) {\n        item.setOrderId(order.getId());\n    }\n    orderItemMapper.insertBatch(items);\n    return order.getId();\n}','考查事务边界和主从表保存。','HARD','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(148,'PROGRAMMING','编写一个动态SQL片段，按username和status可选条件查询用户。','<select id=\"selectPage\" resultMap=\"UserMap\">\n    select id, username, nickname, status\n    from sys_user\n    <where>\n        <if test=\"username != null and username != \'\'\">\n            and username like concat(\'%\', #{username}, \'%\')\n        </if>\n        <if test=\"status != null and status != \'\'\">\n            and status = #{status}\n        </if>\n    </where>\n    order by id desc\n</select>','考查MyBatis动态where和条件判断。','HARD','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(149,'PROGRAMMING','编写一个Java方法，接收用户问题和知识片段，拼接成一个简单Prompt。','public String buildPrompt(String question, String context) {\n    return \"请根据以下资料回答问题：\\n\" + context + \"\\n问题：\" + question;\n}','考查Prompt基本拼接。','EASY','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(150,'PROGRAMMING','编写一个Java方法，判断文本是否为空或全是空白。','public boolean isBlankText(String text) {\n    return text == null || text.trim().isEmpty();\n}','考查文本预处理的基础空值判断。','EASY','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(151,'PROGRAMMING','编写一个Java方法，按换行符切分文本，并过滤空行。','public List<String> splitLines(String text) {\n    if (text == null) {\n        return List.of();\n    }\n    return Arrays.stream(text.split(\"\\\\n\"))\n            .map(String::trim)\n            .filter(line -> !line.isEmpty())\n            .toList();\n}','考查文本清洗和Stream过滤。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(152,'PROGRAMMING','编写一个Java方法，计算两个double数组的点积。','public double dot(double[] a, double[] b) {\n    if (a == null || b == null || a.length != b.length) {\n        throw new IllegalArgumentException(\"向量长度不一致\");\n    }\n    double sum = 0;\n    for (int i = 0; i < a.length; i++) {\n        sum += a[i] * b[i];\n    }\n    return sum;\n}','考查向量计算基础。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(153,'PROGRAMMING','编写一个Java方法，计算double数组的L2范数。','public double norm(double[] vector) {\n    if (vector == null) {\n        return 0;\n    }\n    double sum = 0;\n    for (double value : vector) {\n        sum += value * value;\n    }\n    return Math.sqrt(sum);\n}','考查向量长度计算。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(154,'PROGRAMMING','编写一个Java方法，计算两个向量的余弦相似度。','public double cosine(double[] a, double[] b) {\n    double dotValue = dot(a, b);\n    double denominator = norm(a) * norm(b);\n    if (denominator == 0) {\n        return 0;\n    }\n    return dotValue / denominator;\n}','考查Embedding相似度计算。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(155,'PROGRAMMING','编写一个Java方法，从候选文本列表中找出与查询向量最相似的文本。','public String topOne(double[] query, List<String> texts, List<double[]> vectors) {\n    int bestIndex = -1;\n    double bestScore = -1;\n    for (int i = 0; i < vectors.size(); i++) {\n        double score = cosine(query, vectors.get(i));\n        if (score > bestScore) {\n            bestScore = score;\n            bestIndex = i;\n        }\n    }\n    return bestIndex < 0 ? null : texts.get(bestIndex);\n}','考查简单向量检索流程。','NORMAL','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(156,'PROGRAMMING','编写一个Java方法，根据召回片段列表构造RAG上下文，最多拼接maxChars个字符。','public String buildContext(List<String> chunks, int maxChars) {\n    StringBuilder builder = new StringBuilder();\n    for (String chunk : chunks) {\n        if (chunk == null || chunk.isBlank()) {\n            continue;\n        }\n        if (builder.length() + chunk.length() > maxChars) {\n            break;\n        }\n        builder.append(chunk).append(\"\\n\");\n    }\n    return builder.toString();\n}','考查RAG上下文长度控制。','HARD','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(157,'PROGRAMMING','编写一个Java方法，计算二分类预测的准确率。','public double accuracy(List<Integer> labels, List<Integer> predictions) {\n    if (labels == null || predictions == null || labels.size() != predictions.size() || labels.isEmpty()) {\n        return 0;\n    }\n    int correct = 0;\n    for (int i = 0; i < labels.size(); i++) {\n        if (Objects.equals(labels.get(i), predictions.get(i))) {\n            correct++;\n        }\n    }\n    return correct * 1.0 / labels.size();\n}','考查基础模型评估指标。','HARD','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(158,'PROGRAMMING','编写一个Java方法，按分数从高到低返回Top K文本。','public List<String> topK(List<String> texts, List<Double> scores, int k) {\n    return IntStream.range(0, texts.size())\n            .boxed()\n            .sorted((i, j) -> Double.compare(scores.get(j), scores.get(i)))\n            .limit(k)\n            .map(texts::get)\n            .toList();\n}','考查排序、Top K和检索结果重排。','HARD','ENABLED','2026-06-16 00:34:25','2026-06-16 00:34:25'),(160,'SINGLE','你是谁','A','hahaha','NORMAL','ENABLED','2026-06-16 09:13:08','2026-06-16 09:13:08'),(161,'SINGLE','jdk版本1.8和jdk8的区别','A','1121','NORMAL','ENABLED','2026-06-26 11:00:47','2026-06-26 11:00:47');

/*Table structure for table `exam_question_course` */

DROP TABLE IF EXISTS `exam_question_course`;

CREATE TABLE `exam_question_course` (
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `course_id` bigint NOT NULL COMMENT '课程ID',
  `stage_name` varchar(64) NOT NULL COMMENT '阶段名称',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`question_id`,`course_id`),
  KEY `idx_exam_question_course_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='题目关联课程表';

/*Data for the table `exam_question_course` */

insert  into `exam_question_course`(`question_id`,`course_id`,`stage_name`,`created_at`) values (1,1,'BASIC','2026-06-16 00:00:34'),(2,1,'BASIC','2026-06-16 00:21:44'),(3,1,'BASIC','2026-06-16 00:21:44'),(4,1,'BASIC','2026-06-16 00:21:44'),(5,1,'BASIC','2026-06-16 00:21:44'),(6,1,'BASIC','2026-06-16 00:21:44'),(7,1,'BASIC','2026-06-16 00:21:44'),(8,1,'BASIC','2026-06-16 00:21:44'),(9,1,'BASIC','2026-06-16 00:21:44'),(10,1,'BASIC','2026-06-16 00:21:44'),(11,1,'BASIC','2026-06-16 00:21:44'),(12,1,'BASIC','2026-06-16 00:21:44'),(13,1,'BASIC','2026-06-16 00:21:44'),(14,1,'BASIC','2026-06-16 00:21:44'),(15,1,'BASIC','2026-06-16 00:21:44'),(16,1,'BASIC','2026-06-16 00:21:44'),(17,1,'BASIC','2026-06-16 00:21:44'),(18,1,'BASIC','2026-06-16 00:21:44'),(19,1,'BASIC','2026-06-16 00:21:44'),(20,1,'BASIC','2026-06-16 00:21:44'),(21,1,'BASIC','2026-06-16 00:21:44'),(22,1,'BASIC','2026-06-16 00:21:44'),(23,1,'BASIC','2026-06-16 00:21:44'),(24,1,'BASIC','2026-06-16 00:21:44'),(25,1,'BASIC','2026-06-16 00:21:44'),(26,1,'BASIC','2026-06-16 00:21:44'),(27,1,'BASIC','2026-06-16 00:21:44'),(28,1,'BASIC','2026-06-16 00:21:44'),(29,1,'BASIC','2026-06-16 00:21:44'),(30,1,'BASIC','2026-06-16 00:21:44'),(31,1,'BASIC','2026-06-16 00:21:44'),(32,1,'BASIC','2026-06-16 00:21:44'),(33,1,'BASIC','2026-06-16 00:21:44'),(34,1,'BASIC','2026-06-16 00:21:44'),(35,1,'BASIC','2026-06-16 00:21:44'),(36,1,'BASIC','2026-06-16 00:21:44'),(37,1,'SPRING','2026-06-16 00:21:44'),(38,1,'SPRING','2026-06-16 00:21:44'),(39,1,'SPRING','2026-06-16 00:21:44'),(40,1,'SPRING','2026-06-16 00:21:44'),(41,1,'SPRING','2026-06-16 00:21:44'),(42,1,'SPRING','2026-06-16 00:21:44'),(43,1,'SPRING','2026-06-16 00:21:44'),(44,1,'SPRING','2026-06-16 00:21:44'),(45,1,'SPRING','2026-06-16 00:21:44'),(46,1,'SPRING','2026-06-16 00:21:44'),(47,1,'SPRING','2026-06-16 00:21:44'),(48,1,'SPRING','2026-06-16 00:21:44'),(49,1,'SPRING','2026-06-16 00:21:44'),(50,1,'SPRING','2026-06-16 00:21:44'),(51,1,'SPRING','2026-06-16 00:21:44'),(52,1,'SPRING','2026-06-16 00:21:44'),(53,1,'SPRING','2026-06-16 00:21:44'),(54,1,'SPRING','2026-06-16 00:21:44'),(55,1,'SPRING','2026-06-16 00:21:44'),(56,1,'SPRING','2026-06-16 00:21:44'),(57,1,'SPRING','2026-06-16 00:21:44'),(58,1,'SPRING','2026-06-16 00:21:44'),(59,1,'SPRING','2026-06-16 00:21:44'),(60,1,'SPRING','2026-06-16 00:21:44'),(61,1,'SPRING','2026-06-16 00:21:44'),(62,1,'SPRING','2026-06-16 00:21:44'),(63,1,'SPRING','2026-06-16 00:21:44'),(64,1,'SPRING','2026-06-16 00:21:44'),(65,1,'SPRING','2026-06-16 00:21:44'),(66,1,'SPRING','2026-06-16 00:21:44'),(67,1,'SPRING','2026-06-16 00:21:44'),(68,1,'SPRING','2026-06-16 00:21:44'),(69,1,'SPRING','2026-06-16 00:21:44'),(70,1,'SPRING','2026-06-16 00:21:44'),(71,1,'SPRING','2026-06-16 00:21:44'),(72,1,'AI','2026-06-16 00:21:44'),(73,1,'AI','2026-06-16 00:21:44'),(74,1,'AI','2026-06-16 00:21:44'),(75,1,'AI','2026-06-16 00:21:44'),(76,1,'AI','2026-06-16 00:21:44'),(77,1,'AI','2026-06-16 00:21:44'),(78,1,'AI','2026-06-16 00:21:44'),(79,1,'AI','2026-06-16 00:21:44'),(80,1,'AI','2026-06-16 00:21:44'),(81,1,'AI','2026-06-16 00:21:44'),(82,1,'AI','2026-06-16 00:21:44'),(83,1,'AI','2026-06-16 00:21:44'),(84,1,'AI','2026-06-16 00:21:44'),(85,1,'AI','2026-06-16 00:21:44'),(86,1,'AI','2026-06-16 00:21:44'),(87,1,'AI','2026-06-16 00:21:44'),(88,1,'AI','2026-06-16 00:21:44'),(89,1,'AI','2026-06-16 00:21:44'),(90,1,'AI','2026-06-16 00:21:44'),(91,1,'AI','2026-06-16 00:21:44'),(92,1,'AI','2026-06-16 00:21:44'),(93,1,'AI','2026-06-16 00:21:44'),(94,1,'AI','2026-06-16 00:21:44'),(95,1,'AI','2026-06-16 00:21:44'),(96,1,'AI','2026-06-16 00:21:44'),(97,1,'AI','2026-06-16 00:21:44'),(98,1,'AI','2026-06-16 00:21:44'),(99,1,'AI','2026-06-16 00:21:44'),(100,1,'AI','2026-06-16 00:21:44'),(101,1,'AI','2026-06-16 00:21:44'),(129,1,'BASIC','2026-06-16 00:34:25'),(130,1,'BASIC','2026-06-16 00:34:25'),(131,1,'BASIC','2026-06-16 00:34:25'),(132,1,'BASIC','2026-06-16 00:34:25'),(133,1,'BASIC','2026-06-16 00:34:25'),(134,1,'BASIC','2026-06-16 00:34:25'),(135,1,'BASIC','2026-06-16 00:34:25'),(136,1,'BASIC','2026-06-16 00:34:25'),(137,1,'BASIC','2026-06-16 00:34:25'),(138,1,'BASIC','2026-06-16 00:34:25'),(139,1,'SPRING','2026-06-16 00:34:25'),(140,1,'SPRING','2026-06-16 00:34:25'),(141,1,'SPRING','2026-06-16 00:34:25'),(142,1,'SPRING','2026-06-16 00:34:25'),(143,1,'SPRING','2026-06-16 00:34:25'),(144,1,'SPRING','2026-06-16 00:34:25'),(145,1,'SPRING','2026-06-16 00:34:25'),(146,1,'SPRING','2026-06-16 00:34:25'),(147,1,'SPRING','2026-06-16 00:34:25'),(148,1,'SPRING','2026-06-16 00:34:25'),(149,1,'AI','2026-06-16 00:34:25'),(150,1,'AI','2026-06-16 00:34:25'),(151,1,'AI','2026-06-16 00:34:25'),(152,1,'AI','2026-06-16 00:34:25'),(153,1,'AI','2026-06-16 00:34:25'),(154,1,'AI','2026-06-16 00:34:25'),(155,1,'AI','2026-06-16 00:34:25'),(156,1,'AI','2026-06-16 00:34:25'),(157,1,'AI','2026-06-16 00:34:25'),(158,1,'AI','2026-06-16 00:34:25'),(160,1,'SPRING','2026-06-16 09:13:08'),(161,1,'BASIC','2026-06-26 11:00:47');

/*Table structure for table `exam_question_option` */

DROP TABLE IF EXISTS `exam_question_option`;

CREATE TABLE `exam_question_option` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `option_key` varchar(16) NOT NULL COMMENT '选项标识：A/B/C/D',
  `option_content` text NOT NULL COMMENT '选项内容',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_question_option_key` (`question_id`,`option_key`),
  KEY `idx_exam_question_option_question` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=521 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='题目选项表';

/*Data for the table `exam_question_option` */

insert  into `exam_question_option`(`id`,`question_id`,`option_key`,`option_content`,`sort_order`,`created_at`,`updated_at`) values (1,1,'A','xx',0,'2026-06-15 23:54:40','2026-06-15 23:54:40'),(2,1,'B','xxx',0,'2026-06-15 23:54:40','2026-06-15 23:54:40'),(3,1,'C','xxxx',0,'2026-06-15 23:54:40','2026-06-15 23:54:40'),(4,1,'D','xxxxx',0,'2026-06-15 23:54:40','2026-06-15 23:54:40'),(5,2,'A','class',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(6,3,'A','start方法',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(7,4,'A','int',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(8,5,'A','byte',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(9,6,'A','CharArray',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(10,7,'A','//',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(11,8,'A','make',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(12,9,'A','0',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(13,10,'A','private',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(14,11,'A','所有类都可访问',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(15,12,'A','implements',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(16,13,'A','implements',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(17,14,'A','Set',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(18,15,'A','单个值',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(19,16,'A','Set',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(20,17,'A','throw',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(21,18,'A','只在无异常时执行',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(22,19,'A','封装',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(23,20,'A','参数列表',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(24,21,'A','两个无关类',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(25,22,'A','某个对象',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(26,23,'A','不可重新赋值',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(27,24,'A','private',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(28,25,'A','typeof',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(29,26,'A','频繁拼接字符串',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(30,27,'A','import',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(31,28,'A','include',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(32,29,'A','包名',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(33,30,'A','abstract',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(34,31,'A','Class',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(35,32,'A','O(n)',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(36,33,'A','数组',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(37,34,'A','频繁随机访问',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(38,35,'A','对象内容',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(39,36,'A','对象引用',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(40,37,'A','@Component',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(41,38,'A','@Service',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(42,39,'A','@RequestBody',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(43,40,'A','@Boot',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(44,41,'A','@GetMapping',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(45,42,'A','@GetMapping',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(46,43,'A','URL路径',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(47,44,'A','路径变量',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(48,45,'A','类成员',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(49,46,'A','Node',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(50,47,'A','提高SQL长度',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(51,48,'A','类型',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(52,49,'A','数据库表',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(53,50,'A','实体类',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(54,51,'A','路由跳转',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(55,52,'A','数据库访问',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(56,53,'A','插入数据',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(57,54,'A','所有查询之后',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(58,55,'A','查询',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(59,56,'A','删除',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(60,57,'A','减少数据库表数量',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(61,58,'A','数字大于0',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(62,59,'A','字符串长度',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(63,60,'A','HTTP入口和参数校验',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(64,61,'A','实体或BO',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(65,62,'A','启动事务',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(66,63,'A','main.java',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(67,64,'A','横切关注点',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(68,65,'A','编译Java字节码',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(69,66,'A','所有受检异常',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(70,67,'A','接口签名',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(71,68,'A','先查主表再批量组装关联字段',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(72,69,'A','页面颜色一致',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(73,70,'A','解析Excel',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(74,71,'A','SQL字段为空',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(75,72,'A','人工智能',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(76,73,'A','电源',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(77,74,'A','无网络数据',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(78,75,'A','图片大小',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(79,76,'A','连续数值',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(80,77,'A','最终上线域名',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(81,78,'A','训练参数',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(82,79,'A','模型太小',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(83,80,'A','训练数据也学不好',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(84,81,'A','服务器关机',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(85,82,'A','压缩数据库',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(86,83,'A','接口路径',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(87,84,'A','文本生成和问答',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(88,85,'A','数据库索引',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(89,86,'A','删除知识库',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(90,87,'A','页面布局',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(91,88,'A','向量相似程度',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(92,89,'A','请求成功次数',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(93,90,'A','数据库建表',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(94,91,'A','模型上线',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(95,92,'A','文本片段单位',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(96,93,'A','电脑屏幕大小',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(97,94,'A','服务器温度',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(98,95,'A','压缩文件',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(99,96,'A','优化模型参数',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(100,97,'A','记录登录日志',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(101,98,'A','网络断开',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(102,99,'A','所有预测为正的比例',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(103,100,'A','预测为正中的正确比例',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(104,101,'A','数据库自动扩容',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(132,2,'B','struct',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(133,3,'B','main方法',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(134,4,'B','boolean',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(135,5,'B','String',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(136,6,'B','Text',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(137,7,'B','/* */',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(138,8,'B','new',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(139,9,'B','1',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(140,10,'B','public',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(141,11,'B','仅当前类可访问',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(142,12,'B','inherits',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(143,13,'B','extends',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(144,14,'B','List',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(145,15,'B','栈结构',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(146,16,'B','List',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(147,17,'B','catch',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(148,18,'B','只在编译期执行',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(149,19,'B','继承',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(150,20,'B','返回值名称',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(151,21,'B','父子类',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(152,22,'B','某个线程',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(153,23,'B','必须为空',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(154,24,'B','protected',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(155,25,'B','instanceof',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(156,26,'B','表示真假值',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(157,27,'B','namespace',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(158,28,'B','require',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(159,29,'B','类名',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(160,30,'B','static',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(161,31,'B','System',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(162,32,'B','O(1)',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(163,33,'B','链表',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(164,34,'B','数学计算',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(165,35,'B','字段数量',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(166,36,'B','JSON内容',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(167,37,'B','@Column',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(168,38,'B','@RestController',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(169,39,'B','@RepositoryOnly',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(170,40,'B','@Application',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(171,41,'B','@PostMapping',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(172,42,'B','@PostMapping',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(173,43,'B','请求头',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(174,44,'B','请求体字段',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(175,45,'B','返回值',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(176,46,'B','Bean',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(177,47,'B','替代HTTP协议',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(178,48,'B','文件名',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(179,49,'B','前端页面',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(180,50,'B','配置类',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(181,51,'B','参数签名',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(182,52,'B','页面渲染',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(183,53,'B','查询数据',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(184,54,'B','程序启动时',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(185,55,'B','登录',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(186,56,'B','新增',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(187,57,'B','稳定前后端响应结构',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(188,58,'B','日期格式',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(189,59,'B','邮箱格式',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(190,60,'B','复杂SQL拼接',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(191,61,'B','Controller请求DTO',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(192,62,'B','生成前端页面',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(193,63,'B','pom.lock',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(194,64,'B','实体字段命名',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(195,65,'B','请求前后处理',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(196,66,'B','普通返回值',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(197,67,'B','HTTP状态码',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(198,68,'B','所有字段都写成JSON',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(199,69,'B','重复请求副作用控制',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(200,70,'B','生成Token',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(201,71,'B','页面过宽',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(202,72,'B','自动索引',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(203,73,'B','数据',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(204,74,'B','加密数据',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(205,75,'B','训练时间',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(206,76,'B','固定类别',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(207,77,'B','模型学习',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(208,78,'B','生成日志',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(209,79,'B','数据完全为空',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(210,80,'B','模型记住所有样本',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(211,81,'B','构造有效输入特征',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(212,82,'B','替换Java语法',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(213,83,'B','异常堆栈',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(214,84,'B','硬盘分区',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(215,85,'B','模型输入指令',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(216,86,'B','训练操作系统',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(217,87,'B','短信发送',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(218,88,'B','文件大小',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(219,89,'B','预测正确比例',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(220,90,'B','图片压缩',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(221,91,'B','页面刷新',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(222,92,'B','数据库连接',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(223,93,'B','模型可处理文本长度',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(224,94,'B','请求路径',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(225,95,'B','修改浏览器',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(226,96,'B','删除训练集',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(227,97,'B','衡量预测误差',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(228,98,'B','编译错误',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(229,99,'B','CPU占用率',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(230,100,'B','所有样本数量',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(231,101,'B','回答依据不足或错误',0,'2026-06-16 00:24:54','2026-06-16 00:24:54'),(259,2,'C','function',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(260,3,'C','run方法',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(261,4,'C','char',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(262,5,'C','boolean',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(263,6,'C','Str',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(264,7,'C','#',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(265,8,'C','create',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(266,9,'C','-1',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(267,10,'C','protected',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(268,11,'C','仅子类可访问',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(269,12,'C','instanceof',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(270,13,'C','interface',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(271,14,'C','Map',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(272,15,'C','键值对',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(273,16,'C','ArrayList',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(274,17,'C','error',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(275,18,'C','永远不会执行',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(276,19,'C','编译',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(277,20,'C','包名',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(278,21,'C','同一个方法内部',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(279,22,'C','类',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(280,23,'C','必须继承',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(281,24,'C','default only',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(282,25,'C','isclass',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(283,26,'C','定义接口',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(284,27,'C','package',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(285,28,'C','using',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(286,29,'C','文件夹名',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(287,30,'C','final',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(288,31,'C','Object',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(289,32,'C','O(log n)',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(290,33,'C','红黑树',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(291,34,'C','频繁插入删除',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(292,35,'C','类名',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(293,36,'C','数据库主键',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(294,37,'C','@Table',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(295,38,'C','@Mapper',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(296,39,'C','@Service',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(297,40,'C','@SpringMain',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(298,41,'C','@PutMapping',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(299,42,'C','@PutMapping',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(300,43,'C','请求体JSON',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(301,44,'C','Cookie',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(302,45,'C','异常对象',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(303,46,'C','Packet',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(304,47,'C','降低耦合',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(305,48,'C','端口号',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(306,49,'C','异常类',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(307,50,'C','枚举类',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(308,51,'C','事务管理',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(309,52,'C','用户登录动画',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(310,53,'C','删除文件',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(311,54,'C','主分页查询之前',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(312,55,'C','删除',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(313,56,'C','分页',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(314,57,'C','替代业务校验',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(315,58,'C','字符串非空白',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(316,59,'C','必须唯一',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(317,60,'C','机器学习训练',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(318,61,'C','Mapper接口',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(319,62,'C','拼接查询条件',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(320,63,'C','index.html',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(321,64,'C','页面排版',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(322,65,'C','数据库备份',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(323,66,'C','运行时异常',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(324,67,'C','页面路由',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(325,68,'C','每行前端再查一次',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(326,69,'C','日志文件大小',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(327,70,'C','匹配接口路径',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(328,71,'C','类名太长',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(329,72,'C','应用接口',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(330,73,'C','显示器',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(331,74,'C','带标签数据',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(332,75,'C','连续金额',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(333,76,'C','HTTP方法',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(334,77,'C','删除样本',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(335,78,'C','评估效果',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(336,79,'C','没有训练',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(337,80,'C','测试准确率必定100%',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(338,81,'C','前端按钮颜色',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(339,82,'C','转为可计算数值向量',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(340,83,'C','页面菜单',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(341,84,'C','电路焊接',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(342,85,'C','显卡驱动',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(343,86,'C','查找相关知识',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(344,87,'C','日志打印',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(345,88,'C','CPU温度',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(346,89,'C','内存剩余比例',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(347,90,'C','分类模型',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(348,91,'C','接口鉴权',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(349,92,'C','图像像素',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(350,93,'C','数据库表数量',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(351,94,'C','生成随机性',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(352,95,'C','重启服务器',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(353,96,'C','创建HTTP接口',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(354,97,'C','压缩响应体',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(355,98,'C','过拟合',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(356,99,'C','页面访问量',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(357,100,'C','模型文件大小',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(358,101,'C','浏览器无法启动',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(386,2,'D','module',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(387,3,'D','init方法',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(388,4,'D','double',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(389,5,'D','float',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(390,6,'D','String',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(391,7,'D','--',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(392,8,'D','build',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(393,9,'D','数组长度',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(394,10,'D','final',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(395,11,'D','仅同包可访问',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(396,12,'D','extends',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(397,13,'D','override',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(398,14,'D','Queue',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(399,15,'D','有序数组',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(400,16,'D','LinkedList',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(401,17,'D','finally',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(402,18,'D','通常都会执行',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(403,19,'D','多态',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(404,20,'D','注释内容',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(405,21,'D','数据库表之间',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(406,22,'D','包',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(407,23,'D','自动回收',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(408,24,'D','public',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(409,25,'D','check',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(410,26,'D','捕获异常',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(411,27,'D','module',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(412,28,'D','import',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(413,29,'D','返回值类型',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(414,30,'D','native',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(415,31,'D','Thread',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(416,32,'D','O(n^2)',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(417,33,'D','哈希表',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(418,34,'D','常量池管理',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(419,35,'D','引用地址',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(420,36,'D','注释文本',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(421,37,'D','@EntityId',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(422,38,'D','@BeanOnly',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(423,39,'D','@Path',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(424,40,'D','@SpringBootApplication',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(425,41,'D','@DeleteMapping',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(426,42,'D','@PatchOnly',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(427,43,'D','服务器端口',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(428,44,'D','数据库字段',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(429,45,'D','请求参数',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(430,46,'D','Record',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(431,47,'D','关闭事务',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(432,48,'D','注释内容',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(433,49,'D','配置类',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(434,50,'D','测试报告',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(435,51,'D','文件压缩',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(436,52,'D','线程命名',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(437,53,'D','启动服务',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(438,54,'D','Controller返回之后',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(439,55,'D','更新',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(440,56,'D','导入',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(441,57,'D','关闭跨域',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(442,58,'D','文件存在',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(443,59,'D','不能为null',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(444,60,'D','操作系统调度',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(445,61,'D','领域对象',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(446,62,'D','创建线程池',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(447,63,'D','application.yaml',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(448,64,'D','图片裁剪',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(449,65,'D','数组排序',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(450,66,'D','日志文本',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(451,67,'D','结果映射',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(452,68,'D','删除分页功能',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(453,69,'D','CSS命名',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(454,70,'D','压缩图片',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(455,71,'D','请求被篡改',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(456,72,'D','数组迭代',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(457,73,'D','键盘',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(458,74,'D','空数据',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(459,75,'D','离散类别',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(460,76,'D','代码行号',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(461,77,'D','展示图标',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(462,78,'D','配置端口',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(463,79,'D','训练表现好但泛化差',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(464,80,'D','不需要特征',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(465,81,'D','删除模型文件',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(466,82,'D','关闭训练流程',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(467,83,'D','稠密向量表示',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(468,84,'D','物理联网',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(469,85,'D','操作系统进程',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(470,86,'D','关闭模型',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(471,87,'D','相似度检索',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(472,88,'D','HTTP状态',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(473,89,'D','页面加载速度',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(474,90,'D','线程调度',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(475,91,'D','数据质量问题',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(476,92,'D','线程名称',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(477,93,'D','网络端口数量',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(478,94,'D','数据库密码',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(479,95,'D','继续训练模型',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(480,96,'D','设计页面菜单',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(481,97,'D','生成SQL表',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(482,98,'D','页面空白',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(483,99,'D','真实正例找回比例',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(484,100,'D','接口耗时',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(485,101,'D','Java语法失效',0,'2026-06-16 00:24:55','2026-06-16 00:24:55'),(513,160,'A','我是我',0,'2026-06-16 09:13:08','2026-06-16 09:13:08'),(514,160,'B','xxx',0,'2026-06-16 09:13:08','2026-06-16 09:13:08'),(515,160,'C','xxxx',0,'2026-06-16 09:13:08','2026-06-16 09:13:08'),(516,160,'D','xxxxx',0,'2026-06-16 09:13:08','2026-06-16 09:13:08'),(517,161,'A','111',0,'2026-06-26 11:00:47','2026-06-26 11:00:47'),(518,161,'B','222',0,'2026-06-26 11:00:47','2026-06-26 11:00:47'),(519,161,'C','333',0,'2026-06-26 11:00:47','2026-06-26 11:00:47'),(520,161,'D','444',0,'2026-06-26 11:00:47','2026-06-26 11:00:47');

/*Table structure for table `homework` */

DROP TABLE IF EXISTS `homework`;

CREATE TABLE `homework` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '作业ID',
  `title` varchar(100) NOT NULL COMMENT '作业标题',
  `content_object_key` varchar(500) NOT NULL COMMENT '作业内容对象存储Key',
  `content_file_name` varchar(255) NOT NULL COMMENT '作业内容文件名',
  `answer_object_key` varchar(500) DEFAULT NULL COMMENT '答案对象存储Key',
  `answer_file_name` varchar(255) DEFAULT NULL COMMENT '答案文件名',
  `answer_student_visible` tinyint(1) NOT NULL DEFAULT '0' COMMENT '答案学生是否可见',
  `class_id` bigint NOT NULL COMMENT '班级ID',
  `homework_date` date NOT NULL COMMENT '作业日期',
  `class_content` varchar(255) NOT NULL COMMENT '课程内容',
  `start_time` datetime NOT NULL COMMENT '开始时间',
  `deadline` datetime NOT NULL COMMENT '截止时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_homework_date` (`class_id`,`homework_date`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_deadline` (`deadline`),
  KEY `idx_homework_date` (`homework_date`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='作业表';

/*Data for the table `homework` */

insert  into `homework`(`id`,`title`,`content_object_key`,`content_file_name`,`answer_object_key`,`answer_file_name`,`answer_student_visible`,`class_id`,`homework_date`,`class_content`,`start_time`,`deadline`,`remark`,`created_at`,`updated_at`) values (4,'11 2026-06-23 作业','homework/content/1/20260615/e6d33ea9-cbe0-4d2f-b9dd-6457e1fe6ddb.md','作业测试.md','homework/answer/4/20260615/72b20957-5216-4d0d-b13c-f9f4ca696da1.md','agent面试题.md',0,1,'2026-06-23','xxxx','2026-06-23 00:00:00','2026-06-23 23:59:59','哈哈哈','2026-06-15 14:28:31','2026-06-15 14:28:49'),(5,'10 2026-06-15 作业','homework/content/4/20260615/8346a6dc-e676-42dd-bb38-27be9d3cead4.md','作业测试.md','homework/answer/5/20260615/33c9fc32-8c5d-4a4f-8c1b-5a426d196a35.md','agent面试题.md',1,4,'2026-06-15','xxxx','2026-06-15 00:00:00','2026-06-15 23:59:59','hahaha ','2026-06-15 14:54:29','2026-06-15 15:20:23'),(6,'10 2026-06-14 作业','homework/content/4/20260615/34fab938-7262-449d-a7b9-618ea1296155.md','rag面试题.md',NULL,NULL,0,4,'2026-06-14','休息','2026-06-14 00:00:00','2026-06-15 23:59:59','xxx','2026-06-15 15:24:28','2026-06-15 15:24:28'),(7,'11 2026-06-18 作业','homework/content/1/20260625/c611a810-ba74-4db2-9a3b-0697e08cff67.md','day01-Python快速入门 Python基础语法.md','homework/answer/7/20260625/14f7c696-3be3-4bfd-9534-168e136202d7.md','day01-Python快速入门 Python基础语法.md',1,1,'2026-06-18','自习','2026-06-18 00:00:00','2026-06-18 23:59:59',NULL,'2026-06-25 22:15:35','2026-06-25 22:17:00'),(8,'11 2026-06-20 作业','homework/content/1/20260625/11f58973-4a59-4785-825e-c8d1601a335a.md','day03-Python函数与文件操作.md',NULL,NULL,0,1,'2026-06-20','端午节','2026-06-20 00:00:00','2026-06-20 23:59:59',NULL,'2026-06-25 22:27:02','2026-06-25 22:27:02'),(9,'11 2026-06-26 作业','homework/content/1/20260626/e7b02170-c684-4441-a5e6-06e5e5780600.md','day02-Python常用数据域.md','homework/answer/9/20260626/28863ee8-3c84-44f2-8592-8cead8ea9534.md','day02-Python常用数据域.md',1,1,'2026-06-26','加课','2026-06-26 00:00:00','2026-06-26 23:59:59',NULL,'2026-06-26 15:14:29','2026-06-26 15:15:14');

/*Table structure for table `homework_submission` */

DROP TABLE IF EXISTS `homework_submission`;

CREATE TABLE `homework_submission` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '作业提交ID',
  `homework_id` bigint NOT NULL COMMENT '作业ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `class_id` bigint NOT NULL COMMENT '班级ID',
  `content_object_key` varchar(500) NOT NULL COMMENT '提交内容对象存储Key',
  `content_file_name` varchar(255) NOT NULL COMMENT '提交内容文件名',
  `submit_time` datetime NOT NULL COMMENT '提交时间',
  `late_submitted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否逾期提交',
  `teacher_remark` varchar(500) DEFAULT NULL COMMENT '老师批注',
  `score` int DEFAULT NULL COMMENT '分数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_homework_student` (`homework_id`,`student_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_submit_time` (`submit_time`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='作业提交表';

/*Data for the table `homework_submission` */

insert  into `homework_submission`(`id`,`homework_id`,`student_id`,`class_id`,`content_object_key`,`content_file_name`,`submit_time`,`late_submitted`,`teacher_remark`,`score`,`created_at`,`updated_at`) values (1,5,1,4,'homework/submission/5/1/20260615/fd5f2bfe-8eb0-4247-a6d5-c7e289a0705f.md','微调面试题.md','2026-06-15 15:18:59',0,'15提有问题，xxxx',80,'2026-06-15 15:18:59','2026-06-15 15:30:25'),(2,9,13,1,'homework/submission/9/13/20260626/ac8de595-fa71-4a7d-9d4c-01b09d87917e.md','day02-Python常用数据域.md','2026-06-26 15:14:55',0,'very good',100,'2026-06-26 15:14:55','2026-06-26 15:15:44');

/*Table structure for table `order_payment` */

DROP TABLE IF EXISTS `order_payment`;

CREATE TABLE `order_payment` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '支付订单ID',
  `order_no` varchar(64) NOT NULL COMMENT '支付订单号',
  `student_phone` varchar(30) NOT NULL COMMENT '学生手机号',
  `student_name` varchar(50) NOT NULL COMMENT '学生姓名',
  `product_id` varchar(64) NOT NULL COMMENT '产品ID',
  `order_amount` decimal(10,2) NOT NULL COMMENT '订单支付金额',
  `refunded_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '已申请退款金额，包含退款处理中和退款成功金额',
  `prepay_order_no` varchar(32) NOT NULL COMMENT '预支付订单号',
  `status` varchar(30) NOT NULL COMMENT '支付订单状态',
  `unique_order_no` varchar(128) DEFAULT NULL COMMENT '支付渠道唯一订单号',
  `pay_success_time` datetime DEFAULT NULL COMMENT '支付成功时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_student_phone` (`student_phone`),
  KEY `idx_prepay_order_no` (`prepay_order_no`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='支付订单表';

/*Data for the table `order_payment` */

insert  into `order_payment`(`id`,`order_no`,`student_phone`,`student_name`,`product_id`,`order_amount`,`refunded_amount`,`prepay_order_no`,`status`,`unique_order_no`,`pay_success_time`,`created_at`,`updated_at`) values (1,'1010202606131620220101202848','13293920194','云超','1','0.01','0.00','YQ20260613113424000001','FAIL',NULL,NULL,'2026-06-13 16:22:04','2026-06-13 16:24:07'),(2,'1010202606131626040101097571','13293920194','云超','1','0.01','0.00','YQ20260613113424000001','FAIL',NULL,NULL,'2026-06-13 16:26:23','2026-06-13 16:26:41'),(3,'1010202606131626510101720974','13293920194','云超','1','0.01','0.00','YQ20260613113424000001','SUCCESS','301320260613000000248017190289',NULL,'2026-06-13 16:26:53','2026-06-13 17:28:58'),(4,'1010202606131704250101640775','13293920194','王五','1','0.01','0.00','YQ20260613170408556365585','SUCCESS','301320260613000000158021232865',NULL,'2026-06-13 17:04:30','2026-06-13 18:05:11'),(5,'1010202606131714080101369362','13293920194','李四','1','1.00','0.00','YQ20260613171359566436486','SUCCESS','301320260613000000012022501416',NULL,'2026-06-13 17:14:13','2026-06-13 17:29:34'),(6,'1010202606131718490101120974','13293920194','朝阳','1','0.01','0.00','YQ20260613171842088587865','SUCCESS','301320260613000000103023102386',NULL,'2026-06-13 17:18:53','2026-06-13 17:34:33'),(7,'1010202606131723240101773299','13293920194','黄某','1','0.01','0.00','YQ20260613172316048625376','SUCCESS','301320260613000000314023656858',NULL,'2026-06-13 17:23:26','2026-06-13 17:29:11'),(8,'1010202606131731150101684749','13293920196','赵六','1','0.01','0.00','YQ20260613173057404982071','SUCCESS','301320260613000000228024537477',NULL,'2026-06-13 17:31:19','2026-06-13 17:33:38'),(9,'1010202606150024070101577922','13293920100','赵一','1','0.01','0.00','YQ20260615002331448836484','SUCCESS','301320260615000000057171819131','2026-06-15 00:24:28','2026-06-15 00:24:11','2026-06-15 00:24:28'),(10,'1010202606150912500101415995','13293920199','赵二','1','0.01','0.01','YQ20260615091153891100964','SUCCESS','301320260615000000018196047203','2026-06-15 09:13:11','2026-06-15 09:12:56','2026-06-15 17:07:53'),(11,'YQ20260615225637654165846','13800138000','测试学生','1','20000.00','0.00','1010202606152256070101392646','INIT',NULL,NULL,'2026-06-15 22:56:38','2026-06-15 22:56:38'),(12,'1010202606152304250101106971','13800138000','测试学生','1','20000.00','0.00','YQ20260615230322467122639','FAIL',NULL,NULL,'2026-06-15 23:04:26','2026-06-15 23:04:26'),(13,'1010202606152304530101124435','13800138000','测试学生','1','20000.00','0.00','YQ20260615230322467122639','FAIL',NULL,NULL,'2026-06-15 23:04:54','2026-06-15 23:04:55'),(14,'1010202606152305220101242970','13800138000','测试学生','1','20000.00','0.00','YQ20260615230322467122639','FAIL',NULL,NULL,'2026-06-15 23:05:22','2026-06-15 23:05:23'),(15,'1010202606161432560101969312','13293920132','赵八','1','0.01','0.00','YQ20260616143245311753323','SUCCESS','301320260616000000024351839168','2026-06-16 14:33:18','2026-06-16 14:32:59','2026-06-16 14:34:20'),(16,'1010202606161939020101189132','15252525266','张三','1','0.01','0.00','YQ20260616191453545200390','FAIL',NULL,NULL,'2026-06-16 19:39:28','2026-06-16 19:39:30'),(19,'1010202606162256570101776216','13293920111','赵三','2','0.01','0.00','YQ20260616225633625468428','SUCCESS','301320260616000000115406617162','2026-06-16 22:57:24','2026-06-16 22:57:03','2026-06-16 22:57:25'),(20,'1010202606170909290101671608','13293920122','赵九','2','0.01','0.00','YQ20260617090911376946216','SUCCESS','301320260617000000353434057084','2026-06-17 09:09:54','2026-06-17 09:09:35','2026-06-17 09:09:55'),(21,'1010202606171658400101284088','15698565456','徐成','1','0.01','0.00','YQ20260617165827748383588','FAIL',NULL,NULL,'2026-06-17 16:58:46','2026-06-17 16:58:46'),(23,'1010202606181558200101437401','16161616161','fk','1','0.01','0.00','YQ20260618155621058872682','FAIL',NULL,NULL,'2026-06-18 15:58:27','2026-06-18 15:58:29'),(25,'1010202606181559450101747856','16161616161','fk','1','0.01','0.00','YQ20260618155621058872682','FAIL',NULL,NULL,'2026-06-18 15:59:49','2026-06-18 15:59:50'),(27,'1010202606181610100101099233','16161616161','fk','1','0.01','0.00','YQ20260618155621058872682','FAIL',NULL,NULL,'2026-06-18 16:13:34','2026-06-18 16:13:36'),(30,'1010202606211313510101263494','16161616161','fk','1','0.01','0.00','YQ20260618155621058872682','FAIL',NULL,NULL,'2026-06-21 13:13:54','2026-06-21 13:13:55'),(32,'1010202606222052000101140727','13293920121','hh','1','0.01','0.00','YQ20260622205151639388478','TIMEOUT','MOCK1782132725353034773',NULL,'2026-06-22 20:52:05','2026-06-22 21:07:07'),(33,'1010202606222116450101970109','13293920177','hh','1','0.01','0.01','YQ20260622210858224951690','SUCCESS','MOCK1782134208214432672','2026-06-22 21:16:49','2026-06-22 21:16:48','2026-06-29 22:38:55'),(34,'1010202606231741220101894209','13293920118','黄二','1','0.01','0.00','YQ20260623174008489426093','SUCCESS','301320260623000000352229823733','2026-06-23 17:41:44','2026-06-23 17:41:32','2026-06-23 17:41:44'),(35,'1010202606232043030101917293','13293920178','hyang','1','0.01','0.01','YQ20260623204255341197813','SUCCESS','MOCK1782218589333023881','2026-06-23 20:43:10','2026-06-23 20:43:09','2026-06-23 20:43:43'),(36,'1010202606232158170101352342','13231161635','Danny','1','0.01','0.00','YQ20260623215801977624192','FAIL',NULL,NULL,'2026-06-23 21:59:04','2026-06-23 22:00:56'),(39,'1010202606232209100101855903','13231161635','Danny','1','0.01','0.00','YQ20260623215801977624192','FAIL',NULL,NULL,'2026-06-23 22:09:18','2026-06-23 22:09:19'),(40,'1010202606232214370101066913','13231161635','Danny','1','0.01','0.00','YQ20260623215801977624192','FAIL',NULL,NULL,'2026-06-23 22:14:40','2026-06-23 22:14:47'),(41,'1010202606251915070101814931','13231161635','Danny','1','0.01','0.00','YQ20260623215801977624192','SUCCESS','MOCK-1010202606251915070101814931','2026-06-25 19:15:11','2026-06-25 19:15:11','2026-06-25 19:15:11'),(42,'1010202606251924230101471105','13293920178','hyang','1','0.01','0.01','YQ20260623204255341197813','SUCCESS','MOCK-1010202606251924230101471105','2026-06-25 19:24:25','2026-06-25 19:24:25','2026-06-29 22:17:09'),(43,'1010202606251925340101138364','13293920177','hh','1','0.01','0.01','YQ20260622210858224951690','SUCCESS','MOCK-1010202606251925340101138364','2026-06-25 19:25:37','2026-06-25 19:25:37','2026-06-29 22:16:57'),(44,'1010202606251927250101197464','13293920194','黄某','1','0.01','0.00','YQ20260613172316048625376','SUCCESS','MOCK-1010202606251927250101197464','2026-06-25 19:27:27','2026-06-25 19:27:27','2026-06-25 19:27:27'),(45,'1010202606251937420101169795','16161616161','fk','1','0.01','0.00','YQ20260618155621058872682','SUCCESS','MOCK-1010202606251937420101169795','2026-06-25 19:37:44','2026-06-25 19:37:44','2026-06-25 19:37:44'),(46,'1010202606251938360101617045','15698565456','徐成','1','0.01','0.00','YQ20260617165827748383588','SUCCESS','MOCK-1010202606251938360101617045','2026-06-25 19:38:38','2026-06-25 19:38:38','2026-06-25 19:38:38'),(47,'1010202606251940270101743839','15252525266','张三','1','0.01','0.00','YQ20260616191453545200390','SUCCESS','MOCK-1010202606251940270101743839','2026-06-25 19:40:28','2026-06-25 19:40:28','2026-06-25 19:40:28'),(48,'1010202606252040240101451251','13231161635','Danny','1','0.01','0.01','YQ20260623215801977624192','SUCCESS','MOCK-1010202606252040240101451251','2026-06-25 20:40:26','2026-06-25 20:40:26','2026-06-26 14:14:05'),(49,'1010202606261014020101403627','13222222222','hzh','1','0.01','0.00','YQ20260626101242980321758','FAIL',NULL,NULL,'2026-06-26 10:14:06','2026-06-26 10:14:05'),(51,'1010202606261014270101030509','13888888888','超人强','1','0.01','0.00','YQ20260626095020100709542','FAIL',NULL,NULL,'2026-06-26 10:14:28','2026-06-26 10:14:28'),(54,'1010202606261117560101082954','13817038748','111','1','20000.00','0.00','YQ20260626111731354519397','FAIL',NULL,NULL,'2026-06-26 11:17:59','2026-06-26 11:17:58'),(61,'1010202606261118370101628642','13817038748','111','1','20000.00','0.00','YQ20260626111731354519397','FAIL',NULL,NULL,'2026-06-26 11:18:39','2026-06-26 11:18:39'),(64,'1010202606261126450101489985','13222222222','hzh','1','0.01','0.00','YQ20260626101242980321758','FAIL',NULL,NULL,'2026-06-26 11:26:47','2026-06-26 11:26:46'),(66,'1010202606261127570101435510','13222222222','hzh','1','0.01','0.00','YQ20260626101242980321758','FAIL',NULL,NULL,'2026-06-26 11:27:58','2026-06-26 11:27:56'),(67,'1010202606261505340101088073','13231161636','GGbond','1','0.10','0.10','YQ20260626150523071879406','SUCCESS','MOCK-1010202606261505340101088073','2026-06-26 15:05:38','2026-06-26 15:05:38','2026-06-26 16:34:07'),(68,'1010202606261517090101094321','13817038748','111','1','20000.00','0.00','YQ20260626111731354519397','FAIL',NULL,NULL,'2026-06-26 15:17:09','2026-06-26 15:17:09'),(69,'1010202606261532440101879956','13888888888','超人强','1','0.01','0.00','YQ20260626095020100709542','FAIL',NULL,NULL,'2026-06-26 15:33:01','2026-06-26 15:33:02'),(70,'1010202606261723310101723635','13293920194','朝阳','1','0.01','0.01','YQ20260613171842088587865','SUCCESS','MOCK-1010202606261723310101723635','2026-06-26 17:23:46','2026-06-26 17:23:46','2026-06-29 22:42:37'),(71,'1010202606262135540101237512','13231161637','李明','2','0.01','0.01','YQ20260626213458290537917','SUCCESS','MOCK-1010202606262135540101237512','2026-06-26 21:36:00','2026-06-26 21:36:00','2026-06-29 22:36:14'),(72,'1010202606262136290101936877','13817038748','111','1','20000.00','0.00','YQ20260626111731354519397','FAIL',NULL,NULL,'2026-06-26 21:36:29','2026-06-26 21:36:28'),(73,'1010202606262143310101903419','13800138000','测试学生','1','20000.00','0.00','YQ20260626213630299352654','FAIL',NULL,NULL,'2026-06-26 21:43:32','2026-06-26 21:43:30'),(74,'1010202606272101490101177055','13293920176','ff','1','0.01','0.01','YQ20260627205859062865704','SUCCESS','MOCK1782565312693581338','2026-06-27 21:01:53','2026-06-27 21:01:53','2026-06-29 22:15:56'),(75,'1010202606272154350101641841','13888888888','超人强','1','0.01','0.00','YQ20260626095020100709542','PROCESSING',NULL,NULL,'2026-06-27 21:54:50','2026-06-27 21:54:50'),(76,'1010202606282219350101104350','13800138000','测试学生','1','20000.00','0.00','YQ20260626214332410439324','FAIL',NULL,NULL,'2026-06-28 22:19:38','2026-06-28 22:19:39'),(80,'1010202606282223220101931273','13800138000','测试学生','1','20000.00','0.00','YQ20260626214332410439324','FAIL',NULL,NULL,'2026-06-28 22:23:25','2026-06-28 22:23:26'),(81,'1010202606290020410101943624','13800138000','测试学生','1','20000.00','0.00','YQ20260626214332410439324','FAIL',NULL,NULL,'2026-06-29 00:20:48','2026-06-29 00:20:48');

/*Table structure for table `order_product` */

DROP TABLE IF EXISTS `order_product`;

CREATE TABLE `order_product` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '产品ID',
  `course_content` varchar(1000) NOT NULL COMMENT '课程内容',
  `teaching_mode` varchar(20) NOT NULL DEFAULT 'OFFLINE' COMMENT '上课方式：ONLINE线上，OFFLINE线下',
  `price` decimal(10,2) NOT NULL COMMENT '价格',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订单产品表';

/*Data for the table `order_product` */

insert  into `order_product`(`id`,`course_content`,`teaching_mode`,`price`,`created_at`,`updated_at`) values (1,'JAVA+AI','OFFLINE','20000.00','2026-06-13 11:13:47','2026-06-13 11:21:03'),(2,'AI突击班','ONLINE','15000.00','2026-06-16 22:55:59','2026-06-16 22:55:59');

/*Table structure for table `order_refund` */

DROP TABLE IF EXISTS `order_refund`;

CREATE TABLE `order_refund` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '退款订单ID',
  `refund_order_no` varchar(64) NOT NULL COMMENT '退款订单号',
  `payment_order_no` varchar(64) NOT NULL COMMENT '原支付订单号',
  `payment_amount` decimal(10,2) NOT NULL COMMENT '原支付金额',
  `refund_amount` decimal(10,2) DEFAULT NULL COMMENT '退款金额',
  `status` varchar(30) NOT NULL COMMENT '退款状态：INIT初始化，PROCESSING处理中，SUCCESS成功，FAIL失败，CLOSED关闭',
  `reason` varchar(200) DEFAULT NULL COMMENT '退款原因',
  `unique_refund_no` varchar(128) DEFAULT NULL COMMENT '易宝退款流水号',
  `fail_reason` varchar(500) DEFAULT NULL COMMENT '失败原因',
  `refund_success_time` datetime DEFAULT NULL COMMENT '退款成功时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refund_order_no` (`refund_order_no`),
  KEY `idx_payment_order_no` (`payment_order_no`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='退款订单表';

/*Data for the table `order_refund` */

insert  into `order_refund`(`id`,`refund_order_no`,`payment_order_no`,`payment_amount`,`refund_amount`,`status`,`reason`,`unique_refund_no`,`fail_reason`,`refund_success_time`,`created_at`,`updated_at`) values (1,'101120260615170642003560','1010202606150912500101415995','0.01','0.01','SUCCESS','不想要了','300220260615000000018248600543',NULL,'2026-06-15 17:08:53','2026-06-15 17:07:37','2026-06-15 17:09:04'),(2,'101120260623204335758255','1010202606232043030101917293','0.01','0.01','INIT',NULL,NULL,NULL,NULL,'2026-06-23 20:43:44','2026-06-23 20:43:44'),(4,'101120260626095347326981','1010202606252040240101451251','0.01','0.01','FAIL','666',NULL,'调用yeepay异常 ecan not find private key for provider:,env:,appKey:null',NULL,'2026-06-26 09:53:56','2026-06-26 09:53:55'),(5,'101120260626114918217922','1010202606252040240101451251','0.01','0.01','FAIL','asdfgh',NULL,'调用yeepay异常 ecan not find private key for provider:,env:,appKey:null',NULL,'2026-06-26 11:49:43','2026-06-26 11:49:43'),(6,'101120260626135610021592','1010202606252040240101451251','0.01','0.01','FAIL','111',NULL,'调用yeepay异常 ecan not find private key for provider:,env:,appKey:null',NULL,'2026-06-26 13:56:22','2026-06-26 13:56:22'),(7,'101120260626141405988009','1010202606252040240101451251','0.01','0.01','SUCCESS','虚拟退款','VR2026062614140599923683',NULL,'2026-06-26 14:14:05','2026-06-26 14:14:05','2026-06-26 14:14:05'),(8,'101120260626163406915059','1010202606261505340101088073','0.10','0.10','SUCCESS','1.2','VR2026062616340787131665',NULL,'2026-06-26 16:34:07','2026-06-26 16:34:07','2026-06-26 16:34:07'),(9,'101120260629221544195180','1010202606272101490101177055','0.01','0.01','INIT',NULL,NULL,NULL,NULL,'2026-06-29 22:15:59','2026-06-29 22:15:59'),(10,'101120260629221652058682','1010202606251925340101138364','0.01','0.01','INIT',NULL,NULL,NULL,NULL,'2026-06-29 22:17:00','2026-06-29 22:17:00'),(11,'101120260629221708670166','1010202606251924230101471105','0.01','0.01','INIT',NULL,NULL,NULL,NULL,'2026-06-29 22:17:12','2026-06-29 22:17:12'),(12,'101120260629223617255838','1010202606262135540101237512','0.01','0.01','PROCESSING','local mock refund test','MOCKREFUND1782743777616249564',NULL,NULL,'2026-06-29 22:36:17','2026-06-29 22:36:14'),(13,'101120260629223852261813','1010202606222116450101970109','0.01','0.01','PROCESSING',NULL,'MOCKREFUND1782743938248963582',NULL,NULL,'2026-06-29 22:38:58','2026-06-29 22:38:55'),(14,'101120260629224239103666','1010202606261723310101723635','0.01','0.01','SUCCESS','local mock refund success test','MOCKREFUND1782744159931630836',NULL,'2026-06-29 22:42:40','2026-06-29 22:42:40','2026-06-29 22:42:37');

/*Table structure for table `prepay_order` */

DROP TABLE IF EXISTS `prepay_order`;

CREATE TABLE `prepay_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '预支付订单ID',
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `student_name` varchar(50) NOT NULL COMMENT '学生姓名',
  `student_phone` varchar(30) NOT NULL COMMENT '手机号',
  `product_id` bigint NOT NULL COMMENT '产品ID',
  `product_amount` decimal(10,2) NOT NULL COMMENT '产品金额',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '优惠金额',
  `order_status` varchar(30) NOT NULL DEFAULT 'PENDING_PAYMENT' COMMENT '订单状态：PENDING_PAYMENT待支付，PAID已支付，CANCELED已取消',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_student_phone` (`student_phone`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_order_status` (`order_status`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='预支付订单表';

/*Data for the table `prepay_order` */

insert  into `prepay_order`(`id`,`order_no`,`student_name`,`student_phone`,`product_id`,`product_amount`,`discount_amount`,`order_status`,`created_at`,`updated_at`) values (1,'YQ20260613113424000001','云超','13293920194',1,'20000.00','19999.99','PENDING_PAYMENT','2026-06-13 11:34:24','2026-06-13 15:07:13'),(2,'YQ20260613170408556365585','王五','13293920194',1,'20000.00','19999.99','PENDING_PAYMENT','2026-06-13 17:04:09','2026-06-13 17:04:09'),(3,'YQ20260613171359566436486','李四','13293920194',1,'20000.00','19999.00','PENDING_PAYMENT','2026-06-13 17:14:00','2026-06-13 17:14:00'),(4,'YQ20260613171842088587865','朝阳','13293920194',1,'20000.00','19999.99','PAID','2026-06-13 17:18:42','2026-06-26 17:23:46'),(5,'YQ20260613172316048625376','黄某','13293920194',1,'20000.00','19999.99','PAID','2026-06-13 17:23:16','2026-06-25 19:27:26'),(6,'YQ20260613173057404982071','赵六','13293920196',1,'20000.00','19999.99','PENDING_PAYMENT','2026-06-13 17:30:57','2026-06-13 17:31:09'),(7,'YQ20260615002331448836484','赵一','13293920100',1,'20000.00','19999.99','PENDING_PAYMENT','2026-06-15 00:23:31','2026-06-15 00:23:31'),(8,'YQ20260615091153891100964','赵二','13293920199',1,'20000.00','19999.99','SUCCESS','2026-06-15 09:11:54','2026-06-15 09:13:12'),(9,'1010202606152256070101392646','测试学生','13800138000',1,'20000.00','0.00','PENDING_PAYMENT','2026-06-15 22:56:08','2026-06-15 22:56:08'),(10,'YQ20260615230322467122639','测试学生','13800138000',1,'20000.00','0.00','PENDING_PAYMENT','2026-06-15 23:03:22','2026-06-15 23:03:22'),(11,'YQ20260616143245311753323','赵八','13293920132',1,'20000.00','19999.99','SUCCESS','2026-06-16 14:32:45','2026-06-16 14:34:20'),(12,'YQ20260616191453545200390','张三','15252525266',1,'20000.00','19999.99','PAID','2026-06-16 19:14:54','2026-06-25 19:40:28'),(13,'YQ20260616225633625468428','赵三','13293920111',2,'15000.00','14999.99','SUCCESS','2026-06-16 22:56:34','2026-06-16 22:57:25'),(14,'YQ20260617090911376946216','赵九','13293920122',2,'15000.00','14999.99','SUCCESS','2026-06-17 09:09:11','2026-06-17 09:09:55'),(15,'YQ20260617165827748383588','徐成','15698565456',1,'20000.00','19999.99','PAID','2026-06-17 16:58:28','2026-06-25 19:38:38'),(16,'YQ20260618143613311586271','zh','123123131',2,'15000.00','14999.99','PENDING_PAYMENT','2026-06-18 14:36:13','2026-06-18 14:36:13'),(17,'YQ20260618155621058872682','fk','16161616161',1,'20000.00','19999.99','PAID','2026-06-18 15:56:21','2026-06-25 19:37:43'),(23,'YQ20260622210858224951690','hh','13293920177',1,'20000.00','19999.99','PAID','2026-06-22 21:08:58','2026-06-25 19:25:36'),(24,'YQ20260623174008489426093','黄二','13293920118',1,'20000.00','19999.99','SUCCESS','2026-06-23 17:40:08','2026-06-23 17:41:44'),(25,'YQ20260623204255341197813','hyang','13293920178',1,'20000.00','19999.99','PAID','2026-06-23 20:42:55','2026-06-25 19:24:25'),(26,'YQ20260623215801977624192','Danny','13231161635',1,'20000.00','19999.99','PAID','2026-06-23 21:58:02','2026-06-25 20:40:26'),(27,'YQ20260626095020100709542','超人强','13888888888',1,'20000.00','19999.99','PENDING_PAYMENT','2026-06-26 09:50:20','2026-06-26 09:54:11'),(28,'YQ20260626101242980321758','hzh','13222222222',1,'20000.00','19999.99','PENDING_PAYMENT','2026-06-26 10:12:43','2026-06-26 10:12:43'),(29,'YQ20260626111731354519397','111','13817038748',1,'20000.00','0.00','PENDING_PAYMENT','2026-06-26 11:17:31','2026-06-26 11:17:31'),(30,'YQ20260626150523071879406','GGbond','13231161636',1,'20000.00','19999.90','PAID','2026-06-26 15:05:23','2026-06-26 15:05:38'),(31,'YQ20260626151710018571412','测试学生','13800138000',1,'20000.00','0.00','PAID','2026-06-26 15:17:10','2026-06-26 15:27:49'),(32,'YQ20260626213458290537917','李明','13231161637',2,'15000.00','14999.99','PAID','2026-06-26 21:34:58','2026-06-26 21:35:59'),(33,'YQ20260626213630299352654','测试学生','13800138000',1,'20000.00','0.00','PENDING_PAYMENT','2026-06-26 21:36:30','2026-06-26 21:36:30'),(34,'YQ20260626214332410439324','测试学生','13800138000',1,'20000.00','0.00','PENDING_PAYMENT','2026-06-26 21:43:32','2026-06-26 21:43:32'),(35,'YQ20260627205859062865704','ff','13293920176',1,'20000.00','19999.99','PAID','2026-06-27 20:58:59','2026-06-29 22:31:35'),(36,'YQ20260629213417587502508','qwer','13293920175',1,'20000.00','0.00','PENDING_PAYMENT','2026-06-29 21:34:18','2026-06-29 21:34:18');

/*Table structure for table `student` */

DROP TABLE IF EXISTS `student`;

CREATE TABLE `student` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学生ID',
  `student_no` varchar(32) NOT NULL COMMENT '学员编号',
  `student_name` varchar(50) NOT NULL COMMENT '学生姓名',
  `student_phone` varchar(30) NOT NULL COMMENT '手机号',
  `gender` varchar(10) DEFAULT NULL COMMENT '???MALE?/FEMALE??F014??????',
  `password` varchar(128) NOT NULL COMMENT '登录密码',
  `education` varchar(30) NOT NULL COMMENT '学历',
  `grade_year` int NOT NULL COMMENT '届数',
  `school` varchar(100) NOT NULL COMMENT '学校',
  `major` varchar(100) DEFAULT NULL COMMENT '专业',
  `teaching_mode` varchar(20) NOT NULL DEFAULT 'ONLINE' COMMENT '上课方式：ONLINE线上，OFFLINE线下',
  `class_id` bigint DEFAULT NULL COMMENT '班级ID，线下班必填',
  `student_tag` varchar(50) DEFAULT NULL COMMENT '学生标签',
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE启用，INACTIVE停用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_no` (`student_no`),
  UNIQUE KEY `uk_student_phone` (`student_phone`),
  KEY `idx_status` (`status`),
  KEY `idx_teaching_mode` (`teaching_mode`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_student_tag` (`student_tag`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生表';

/*Data for the table `student` */

insert  into `student`(`id`,`student_no`,`student_name`,`student_phone`,`gender`,`password`,`education`,`grade_year`,`school`,`major`,`teaching_mode`,`class_id`,`student_tag`,`status`,`created_at`,`updated_at`) values (1,'STU20260615094806539163','赵二','13293920199',NULL,'123456','本科',2026,'湖南师范大学','计算机科学与技术','OFFLINE',4,NULL,'ACTIVE','2026-06-15 09:48:07','2026-06-15 14:53:33'),(2,'STU20260616144319767056','赵八','13293920132',NULL,'123456','本科',2026,'湖南师范大学','计算机科学与技术','OFFLINE',4,NULL,'ACTIVE','2026-06-16 14:43:20','2026-06-16 14:43:34'),(3,'STU20260616225903144304','赵三','13293920111',NULL,'123456','本科',2026,'湖南师范大学','计算机科学与技术','ONLINE',NULL,'普通学员','ACTIVE','2026-06-13 22:59:04','2026-06-17 12:34:50'),(4,'STU20260617091013345820','赵九','13293920122',NULL,'123456','本科',2026,'湖南师范大学','计算机科学与技术','ONLINE',NULL,'摆烂学员','ACTIVE','2026-06-13 09:10:14','2026-06-17 12:34:50'),(5,'STU20260623174216524468','黄二','13293920118',NULL,'123456','本科',2026,'湖南师范大学','计算机科学与技术','OFFLINE',NULL,NULL,'ACTIVE','2026-06-23 17:42:16','2026-06-23 17:42:16'),(6,'STU20260623210012093515','hyang','13293920178',NULL,'123456','本科',2026,'湖南师范大学','计算机科学与技术','OFFLINE',1,NULL,'ACTIVE','2026-06-23 21:00:12','2026-06-26 10:22:35'),(7,'STU20260625191510190060','Danny','13231161635',NULL,'13231161635','未填写',0,'未填写','','OFFLINE',1,NULL,'ACTIVE','2026-06-25 19:15:11','2026-06-26 10:32:48'),(8,'STU20260625192536393954','hh','13293920177',NULL,'13293920177','未填写',0,'未填写','','OFFLINE',NULL,NULL,'ACTIVE','2026-06-25 19:25:37','2026-06-25 19:25:37'),(9,'STU20260625192726841672','黄某','13293920194',NULL,'13293920194','未填写',0,'未填写','','OFFLINE',NULL,NULL,'ACTIVE','2026-06-25 19:27:27','2026-06-25 19:27:27'),(10,'STU20260625193744061981','fk','16161616161',NULL,'16161616161','未填写',0,'未填写','','OFFLINE',NULL,NULL,'ACTIVE','2026-06-25 19:37:44','2026-06-25 19:37:44'),(12,'STU20260625194028190791','张三','15252525266',NULL,'15252525266','未填写',0,'未填写','','OFFLINE',9,NULL,'ACTIVE','2026-06-25 19:40:29','2026-06-29 00:17:39'),(13,'STU20260626150950056850','GGbond','13231161636',NULL,'123456','本科',2026,'河北水利电力学院','PC专业','OFFLINE',1,NULL,'ACTIVE','2026-06-26 15:09:50','2026-06-26 15:11:11'),(14,'STU20260626213703192252','李明','13231161637',NULL,'123456','本科',2026,'清华大学','人工智能','ONLINE',NULL,NULL,'ACTIVE','2026-06-26 21:37:03','2026-06-26 21:37:03'),(15,'STU20260627210219422378','ff','13293920176',NULL,'123456','本科',2026,'湖南师范大学','计算机科学与技术','OFFLINE',1,NULL,'ACTIVE','2026-06-27 21:02:20','2026-06-27 21:10:13');

/*Table structure for table `student_dorm` */

DROP TABLE IF EXISTS `student_dorm`;

CREATE TABLE `student_dorm` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '瀹胯垗鍒嗛厤ID',
  `student_id` bigint NOT NULL COMMENT '瀛︾敓ID',
  `campus_name` varchar(100) NOT NULL COMMENT '鏍″尯鍚嶇О',
  `building_name` varchar(100) NOT NULL COMMENT '妤兼爧鍚嶇О',
  `room_no` varchar(50) NOT NULL COMMENT '鎴块棿鍙',
  `bed_no` varchar(50) NOT NULL COMMENT '搴婁綅鍙',
  `room_type` varchar(50) DEFAULT NULL COMMENT '鎴垮瀷',
  `check_in_status` varchar(30) NOT NULL DEFAULT 'ASSIGNED' COMMENT '鍏ヤ綇鐘舵?锛欰SSIGNED宸插垎閰嶏紝CHECKED_IN宸插叆浣忥紝CHECKED_OUT宸查?瀹',
  `check_in_date` date DEFAULT NULL COMMENT '鍏ヤ綇鏃ユ湡',
  `roommate_names` varchar(255) DEFAULT NULL COMMENT '瀹ゅ弸濮撳悕锛岄?鍙峰垎闅',
  `manager_name` varchar(50) DEFAULT NULL COMMENT '瀹跨?濮撳悕',
  `manager_phone` varchar(30) DEFAULT NULL COMMENT '瀹跨?鐢佃瘽',
  `remark` varchar(500) DEFAULT NULL COMMENT '澶囨敞',
  `assigned_by` bigint DEFAULT NULL COMMENT '鍒嗛厤浜虹敤鎴稩D',
  `assigned_at` datetime DEFAULT NULL COMMENT '鍒嗛厤鏃堕棿',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '鍒涘缓鏃堕棿',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '鏇存柊鏃堕棿',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_id` (`student_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_check_in_status` (`check_in_status`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='瀛︾敓瀹胯垗鍒嗛厤琛';

/*Data for the table `student_dorm` */

insert  into `student_dorm`(`id`,`student_id`,`campus_name`,`building_name`,`room_no`,`bed_no`,`room_type`,`check_in_status`,`check_in_date`,`roommate_names`,`manager_name`,`manager_phone`,`remark`,`assigned_by`,`assigned_at`,`created_at`,`updated_at`) values (1,3,'杭州校区','1号楼','503','D','四人间','CHECKED_IN','2026-06-23','赵三、赵八','宿管王老师','13800009999','请按班主任通知办理入住，保持宿舍整洁。',NULL,'2026-06-23 21:33:36','2026-06-23 21:33:36','2026-06-23 21:33:36'),(2,5,'杭州校区','1号楼','502','B','四人间','CHECKED_IN','2026-06-23','赵三、赵八','宿管王老师','13800009999','请按班主任通知办理入住，保持宿舍整洁。',NULL,'2026-06-23 21:33:36','2026-06-23 21:33:36','2026-06-23 21:33:36'),(3,4,'杭州校区','1号楼','501','A','四人间','CHECKED_IN','2026-06-23','赵三、赵八','宿管王老师','13800009999','请按班主任通知办理入住，保持宿舍整洁。',NULL,'2026-06-23 21:33:36','2026-06-23 21:33:36','2026-06-23 21:33:36'),(4,2,'杭州校区','1号楼','502','C','四人间','CHECKED_IN','2026-06-23','赵三、赵八','宿管王老师','13800009999','请按班主任通知办理入住，保持宿舍整洁。',NULL,'2026-06-23 21:33:36','2026-06-23 21:33:36','2026-06-23 21:33:36'),(5,6,'杭州校区','1号楼','503','E','四人间','ASSIGNED','2026-06-19','赵三、赵八','宿管王老师','13800009999','请按班主任通知办理入住，保持宿舍整洁。',21,'2026-06-26 17:38:31','2026-06-23 21:33:36','2026-06-26 17:38:31'),(6,1,'杭州校区','1号楼','501','B','四人间','CHECKED_IN','2026-06-23','赵三、赵八','宿管王老师','13800009999','请按班主任通知办理入住，保持宿舍整洁。',NULL,'2026-06-23 21:33:36','2026-06-23 21:33:36','2026-06-23 21:33:36'),(12,15,'杭州校区','1号楼','508','A','四人间','ASSIGNED','2026-06-12','赵三、赵八',NULL,'13800009999',NULL,21,'2026-06-27 21:09:38','2026-06-27 21:03:17','2026-06-27 21:09:38');

/*Table structure for table `student_dorm_bill` */

DROP TABLE IF EXISTS `student_dorm_bill`;

CREATE TABLE `student_dorm_bill` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '宿舍缴费账单ID',
  `bill_no` varchar(64) NOT NULL COMMENT '宿舍缴费账单号',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `student_name` varchar(50) NOT NULL COMMENT '学生姓名',
  `student_phone` varchar(30) DEFAULT NULL COMMENT '学生手机号',
  `dorm_id` bigint NOT NULL COMMENT '宿舍分配ID',
  `bill_title` varchar(100) NOT NULL COMMENT '账单标题',
  `fee_type` varchar(30) NOT NULL DEFAULT 'DORM_FEE' COMMENT '费用类型：DORM_FEE住宿费，WATER_ELECTRIC水电费',
  `bill_period` varchar(50) DEFAULT NULL COMMENT '账期',
  `payable_amount` decimal(10,2) NOT NULL COMMENT '应缴金额',
  `paid_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '实缴金额',
  `status` varchar(30) NOT NULL DEFAULT 'UNPAID' COMMENT '账单状态：UNPAID待缴费，PAYING支付中，PAID已支付，CLOSED已关闭',
  `alipay_trade_no` varchar(128) DEFAULT NULL COMMENT '支付宝交易号',
  `pay_success_time` datetime DEFAULT NULL COMMENT '支付成功时间',
  `due_date` datetime DEFAULT NULL COMMENT '缴费截止时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_by` bigint DEFAULT NULL COMMENT '创建人用户ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bill_no` (`bill_no`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_dorm_id` (`dorm_id`),
  KEY `idx_status` (`status`),
  KEY `idx_alipay_trade_no` (`alipay_trade_no`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生宿舍缴费账单表';

/*Data for the table `student_dorm_bill` */

insert  into `student_dorm_bill`(`id`,`bill_no`,`student_id`,`student_name`,`student_phone`,`dorm_id`,`bill_title`,`fee_type`,`bill_period`,`payable_amount`,`paid_amount`,`status`,`alipay_trade_no`,`pay_success_time`,`due_date`,`remark`,`created_by`,`created_at`,`updated_at`) values (4,'DORM20260626170825033563',6,'hyang','13293920178',5,'住宿费','DORM_FEE','2026-06','10000.00','0.00','PAYING',NULL,NULL,'2026-06-27 04:11:00',NULL,21,'2026-06-26 17:08:26','2026-06-26 17:08:31'),(5,'DORM20260626173831051794',6,'hyang','13293920178',5,'住宿费','DORM_FEE','2026-06','100.00','100.00','PAID','2026062622001475290509497082','2026-06-26 20:44:44','2026-06-27 05:42:00',NULL,21,'2026-06-26 17:38:32','2026-06-26 20:44:42'),(6,'DORM20260627210316705455',15,'ff','13293920176',12,'住宿费','DORM_FEE','2026-06','800.00','0.00','PAYING',NULL,NULL,'2026-06-28 06:05:00',NULL,21,'2026-06-27 21:03:17','2026-06-27 21:03:18'),(7,'DORM20260627210938127514',15,'ff','13293920176',12,'住宿费','DORM_FEE','2026-06','9000.00','9000.00','PAID','MOCK_ALIPAY_1782565792583','2026-06-27 21:09:53','2026-06-28 06:09:00',NULL,21,'2026-06-27 21:09:38','2026-06-27 21:09:49');

/*Table structure for table `student_exam_answer` */

DROP TABLE IF EXISTS `student_exam_answer`;

CREATE TABLE `student_exam_answer` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学生考试答案ID',
  `record_id` bigint NOT NULL COMMENT '学生考试记录ID',
  `exam_id` bigint NOT NULL COMMENT '考试ID',
  `paper_id` bigint NOT NULL COMMENT '试卷ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `question_type` varchar(32) NOT NULL COMMENT '题型',
  `question_score` decimal(10,2) NOT NULL COMMENT '题目分数',
  `answer_content` text COMMENT '学生答案内容',
  `correct` tinyint(1) DEFAULT NULL COMMENT '是否正确，主观题/编程题可为空',
  `score` decimal(10,2) DEFAULT NULL COMMENT '本题得分',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_record_question` (`record_id`,`question_id`),
  KEY `idx_student_exam_answer_record` (`record_id`),
  KEY `idx_student_exam_answer_exam` (`exam_id`),
  KEY `idx_student_exam_answer_question` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生考试答案表';

/*Data for the table `student_exam_answer` */

insert  into `student_exam_answer`(`id`,`record_id`,`exam_id`,`paper_id`,`question_id`,`question_type`,`question_score`,`answer_content`,`correct`,`score`,`created_at`,`updated_at`) values (1,2,1,1,76,'SINGLE','2.00','A',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(2,2,1,1,75,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(3,2,1,1,74,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(4,2,1,1,73,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(5,2,1,1,72,'SINGLE','2.00','A',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(6,2,1,1,42,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(7,2,1,1,41,'SINGLE','2.00','A',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(8,2,1,1,40,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(9,2,1,1,39,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(10,2,1,1,38,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(11,2,1,1,37,'SINGLE','2.00','A',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(12,2,1,1,8,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(13,2,1,1,7,'SINGLE','2.00','A',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(14,2,1,1,6,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(15,2,1,1,5,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(16,2,1,1,4,'SINGLE','2.00','A',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(17,2,1,1,3,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(18,2,1,1,2,'SINGLE','2.00','A',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(19,2,1,1,160,'SINGLE','2.00','A',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(20,2,1,1,95,'SINGLE','2.00','D',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(21,2,1,1,94,'SINGLE','2.00','C',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(22,2,1,1,93,'SINGLE','2.00','B',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(23,2,1,1,92,'SINGLE','2.00','C',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(24,2,1,1,91,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(25,2,1,1,90,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(26,2,1,1,89,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(27,2,1,1,88,'SINGLE','2.00','A',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(28,2,1,1,87,'SINGLE','2.00','A',0,'0.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(29,2,1,1,86,'SINGLE','2.00','C',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(30,2,1,1,85,'SINGLE','2.00','B',1,'2.00','2026-06-16 11:35:10','2026-06-16 11:35:10'),(31,2,1,1,155,'PROGRAMMING','10.00','{\n  dhfkjfioewjfoewijfw\n\n}',NULL,'5.00','2026-06-16 11:35:10','2026-06-16 14:50:25'),(32,2,1,1,154,'PROGRAMMING','10.00','ewfkerg',NULL,'5.00','2026-06-16 11:35:10','2026-06-16 14:50:25'),(33,2,1,1,153,'PROGRAMMING','10.00','gerjgle',NULL,'5.00','2026-06-16 11:35:10','2026-06-16 14:50:25'),(34,2,1,1,152,'PROGRAMMING','10.00','rejghuerhgoerw',NULL,'5.00','2026-06-16 11:35:10','2026-06-16 14:50:25'),(35,3,2,2,76,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(36,3,2,2,75,'SINGLE','2.00','B',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(37,3,2,2,74,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(38,3,2,2,73,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(39,3,2,2,72,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(40,3,2,2,42,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(41,3,2,2,41,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(42,3,2,2,40,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(43,3,2,2,39,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(44,3,2,2,38,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(45,3,2,2,37,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(46,3,2,2,8,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(47,3,2,2,7,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(48,3,2,2,6,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(49,3,2,2,5,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(50,3,2,2,4,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(51,3,2,2,3,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(52,3,2,2,2,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(53,3,2,2,101,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(54,3,2,2,100,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(55,3,2,2,99,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(56,3,2,2,98,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(57,3,2,2,97,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(58,3,2,2,96,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(59,3,2,2,71,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(60,3,2,2,70,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(61,3,2,2,69,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(62,3,2,2,68,'SINGLE','2.00','A',1,'2.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(63,3,2,2,67,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(64,3,2,2,66,'SINGLE','2.00','A',0,'0.00','2026-06-16 15:04:01','2026-06-16 15:04:01'),(65,3,2,2,158,'PROGRAMMING','10.00','xxxkjndfkls',NULL,'10.00','2026-06-16 15:04:01','2026-06-26 10:57:17'),(66,3,2,2,157,'PROGRAMMING','10.00','dgnjklsdngldfs',NULL,'10.00','2026-06-16 15:04:01','2026-06-26 10:57:17'),(67,3,2,2,156,'PROGRAMMING','10.00','fdgk;dfskgdfs;kg;sdf',NULL,'10.00','2026-06-16 15:04:01','2026-06-26 10:57:17'),(68,3,2,2,148,'PROGRAMMING','10.00','dsajkfadklsnfglad',NULL,'10.00','2026-06-16 15:04:01','2026-06-26 10:57:17'),(69,4,3,3,42,'SINGLE','2.00','A',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(70,4,3,3,41,'SINGLE','2.00','B',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(71,4,3,3,40,'SINGLE','2.00','B',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(72,4,3,3,39,'SINGLE','2.00','C',1,'2.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(73,4,3,3,38,'SINGLE','2.00','B',1,'2.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(74,4,3,3,37,'SINGLE','2.00','D',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(75,4,3,3,160,'SINGLE','2.00','A',1,'2.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(76,4,3,3,63,'SINGLE','2.00','B',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(77,4,3,3,62,'SINGLE','2.00','C',1,'2.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(78,4,3,3,61,'SINGLE','2.00','D',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(79,4,3,3,60,'SINGLE','2.00','C',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(80,4,3,3,59,'SINGLE','2.00','C',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(81,4,3,3,58,'SINGLE','2.00','A',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(82,4,3,3,57,'SINGLE','2.00','A',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(83,4,3,3,56,'SINGLE','2.00','A',1,'2.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(84,4,3,3,55,'SINGLE','2.00','C',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(85,4,3,3,71,'SINGLE','2.00','B',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(86,4,3,3,70,'SINGLE','2.00','C',1,'2.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(87,4,3,3,69,'SINGLE','2.00','B',1,'2.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(88,4,3,3,68,'SINGLE','2.00','D',0,'0.00','2026-06-26 15:47:14','2026-06-26 15:47:14'),(89,4,3,3,140,'PROGRAMMING','10.00','aaa',NULL,'10.00','2026-06-26 15:47:14','2026-06-26 15:47:53'),(90,4,3,3,139,'PROGRAMMING','20.00','aaa',NULL,'10.00','2026-06-26 15:47:14','2026-06-26 15:47:53'),(91,4,3,3,148,'PROGRAMMING','20.00','aaa',NULL,'10.00','2026-06-26 15:47:14','2026-06-26 15:47:53'),(92,4,3,3,147,'PROGRAMMING','10.00','aaa',NULL,'10.00','2026-06-26 15:47:14','2026-06-26 15:47:53');

/*Table structure for table `student_exam_record` */

DROP TABLE IF EXISTS `student_exam_record`;

CREATE TABLE `student_exam_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学生考试记录ID',
  `exam_id` bigint NOT NULL COMMENT '考试ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `start_time` datetime NOT NULL COMMENT '实际开始答题时间',
  `deadline_time` datetime NOT NULL COMMENT '当前学生本次考试截止时间',
  `submit_time` datetime DEFAULT NULL COMMENT '提交时间',
  `status` varchar(32) NOT NULL COMMENT '状态：IN_PROGRESS/SUBMITTED/TIMEOUT',
  `grading_status` varchar(32) NOT NULL DEFAULT 'PENDING' COMMENT '批改状态：PENDING/GRADING/COMPLETED',
  `score` decimal(10,2) DEFAULT NULL COMMENT '得分',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_student` (`exam_id`,`student_id`),
  KEY `idx_student_exam_record_student` (`student_id`,`status`),
  KEY `idx_student_exam_record_exam` (`exam_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生考试记录表';

/*Data for the table `student_exam_record` */

insert  into `student_exam_record`(`id`,`exam_id`,`student_id`,`start_time`,`deadline_time`,`submit_time`,`status`,`grading_status`,`score`,`created_at`,`updated_at`) values (2,1,1,'2026-06-16 11:08:58','2026-06-16 11:38:58','2026-06-16 11:35:10','SUBMITTED','COMPLETED','48.00','2026-06-16 11:08:58','2026-06-16 14:50:25'),(3,2,1,'2026-06-16 15:01:50','2026-06-16 16:00:00','2026-06-16 15:04:01','SUBMITTED','COMPLETED','60.00','2026-06-16 15:01:50','2026-06-26 10:57:17'),(4,3,13,'2026-06-26 15:46:35','2026-06-26 16:00:00','2026-06-26 15:47:14','SUBMITTED','COMPLETED','54.00','2026-06-26 15:46:35','2026-06-26 15:47:53');

/*Table structure for table `student_followup_record` */

DROP TABLE IF EXISTS `student_followup_record`;

CREATE TABLE `student_followup_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `learning_plan_id` bigint NOT NULL COMMENT '线上学习计划ID',
  `student_tag` varchar(64) NOT NULL COMMENT '生成时学生标签快照',
  `followup_tag_id` bigint NOT NULL COMMENT '回访标签配置ID',
  `enroll_date` date NOT NULL COMMENT '线上入学日期',
  `last_followup_time` datetime DEFAULT NULL COMMENT '生成时上一条回访时间',
  `due_date` date NOT NULL COMMENT '应回访日期',
  `followup_interval_days` int NOT NULL COMMENT '生成时回访间隔天数快照',
  `status` varchar(32) NOT NULL DEFAULT 'NEED_FOLLOWUP' COMMENT '状态：NEED_FOLLOWUP需要回访，FOLLOWED已回访，CANCELED已取消',
  `followup_user_id` bigint DEFAULT NULL COMMENT '回访人ID',
  `followup_time` datetime DEFAULT NULL COMMENT '回访时间',
  `followup_content` varchar(2000) DEFAULT NULL COMMENT '回访内容',
  `followup_video_object_key` varchar(512) DEFAULT NULL COMMENT '回访会议视频对象Key',
  `followup_video_file_name` varchar(255) DEFAULT NULL COMMENT '回访会议视频文件名',
  `remark` varchar(512) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_followup_due` (`student_id`,`due_date`),
  KEY `idx_student_followup_due_status` (`due_date`,`status`),
  KEY `idx_student_followup_student` (`student_id`),
  KEY `idx_student_followup_tag` (`student_tag`),
  KEY `idx_student_followup_user` (`followup_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生回访记录表';

/*Data for the table `student_followup_record` */

insert  into `student_followup_record`(`id`,`student_id`,`learning_plan_id`,`student_tag`,`followup_tag_id`,`enroll_date`,`last_followup_time`,`due_date`,`followup_interval_days`,`status`,`followup_user_id`,`followup_time`,`followup_content`,`followup_video_object_key`,`followup_video_file_name`,`remark`,`created_at`,`updated_at`) values (1,3,0,'普通学员',1,'2026-06-13',NULL,'2026-06-17',4,'FOLLOWED',14,'2026-06-17 12:42:57','已经回访','student/followup/1/20260617/dc47df02-569c-4a21-836d-5308dca86fa4.mp4','12b9d79803cc40f0a41929084d860e81-55552026-03-23_010716_965.mp4',NULL,'2026-06-17 12:34:57','2026-06-17 12:42:57'),(2,3,0,'普通学员',1,'2026-06-13','2026-06-17 12:42:57','2026-06-21',4,'CANCELED',NULL,NULL,NULL,NULL,NULL,'后台取消','2026-06-24 16:11:33','2026-06-26 16:27:21'),(3,3,0,'普通学员',1,'2026-06-13','2026-06-21 00:00:00','2026-06-25',4,'NEED_FOLLOWUP',NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-26 16:40:06','2026-06-26 16:40:06');

/*Table structure for table `student_followup_tag` */

DROP TABLE IF EXISTS `student_followup_tag`;

CREATE TABLE `student_followup_tag` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `student_tag` varchar(64) NOT NULL COMMENT '学生标签',
  `followup_interval_days` int NOT NULL COMMENT '回访间隔天数',
  `status` varchar(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE启用，INACTIVE停用',
  `remark` varchar(512) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_followup_tag_student_tag` (`student_tag`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生回访标签配置表';

/*Data for the table `student_followup_tag` */

insert  into `student_followup_tag`(`id`,`student_tag`,`followup_interval_days`,`status`,`remark`,`created_at`,`updated_at`) values (1,'普通学员',4,'ACTIVE',NULL,'2026-06-17 10:00:22','2026-06-17 10:00:22'),(2,'摆烂学员',15,'ACTIVE',NULL,'2026-06-17 10:00:28','2026-06-17 10:00:28');

/*Table structure for table `student_learning_calendar` */

DROP TABLE IF EXISTS `student_learning_calendar`;

CREATE TABLE `student_learning_calendar` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学习日历ID',
  `plan_id` bigint NOT NULL COMMENT '学习计划ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `study_date` date NOT NULL COMMENT '学习日期',
  `stage_name` varchar(128) NOT NULL COMMENT '阶段名称',
  `day_index` int NOT NULL COMMENT '计划总第几天',
  `stage_day_index` int NOT NULL COMMENT '阶段第几天',
  `status` varchar(20) NOT NULL DEFAULT 'TODO' COMMENT '状态：TODO待学习，DONE已完成',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_learning_calendar_plan_date` (`plan_id`,`study_date`),
  KEY `idx_learning_calendar_student` (`student_id`),
  KEY `idx_learning_calendar_plan` (`plan_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='线上学员每日学习日历表';

/*Data for the table `student_learning_calendar` */

insert  into `student_learning_calendar`(`id`,`plan_id`,`student_id`,`study_date`,`stage_name`,`day_index`,`stage_day_index`,`status`,`created_at`,`updated_at`) values (1,1,3,'2026-06-17','BASIC',1,1,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(2,1,3,'2026-06-18','BASIC',2,2,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(3,1,3,'2026-06-19','BASIC',3,3,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(4,1,3,'2026-06-20','BASIC',4,4,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(5,1,3,'2026-06-21','BASIC',5,5,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(6,1,3,'2026-06-22','BASIC',6,6,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(7,1,3,'2026-06-23','BASIC',7,7,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(8,1,3,'2026-06-24','BASIC',8,8,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(9,1,3,'2026-06-25','BASIC',9,9,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(10,1,3,'2026-06-26','BASIC',10,10,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(11,1,3,'2026-06-27','SPRING',11,1,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(12,1,3,'2026-06-28','SPRING',12,2,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(13,1,3,'2026-06-29','SPRING',13,3,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(14,1,3,'2026-06-30','SPRING',14,4,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(15,1,3,'2026-07-01','SPRING',15,5,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(16,1,3,'2026-07-02','SPRING',16,6,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(17,1,3,'2026-07-03','SPRING',17,7,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(18,1,3,'2026-07-04','SPRING',18,8,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(19,1,3,'2026-07-05','SPRING',19,9,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(20,1,3,'2026-07-06','SPRING',20,10,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(21,1,3,'2026-07-07','AI',21,1,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(22,1,3,'2026-07-08','AI',22,2,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(23,1,3,'2026-07-09','AI',23,3,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(24,1,3,'2026-07-10','AI',24,4,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(25,1,3,'2026-07-11','AI',25,5,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(26,1,3,'2026-07-12','AI',26,6,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(27,1,3,'2026-07-13','AI',27,7,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(28,1,3,'2026-07-14','AI',28,8,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(29,1,3,'2026-07-15','AI',29,9,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(30,1,3,'2026-07-16','AI',30,10,'TODO','2026-06-17 08:23:18','2026-06-17 08:23:18'),(31,2,4,'2026-06-17','BASIC',1,1,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(32,2,4,'2026-06-18','BASIC',2,2,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(33,2,4,'2026-06-19','BASIC',3,3,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(34,2,4,'2026-06-20','BASIC',4,4,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(35,2,4,'2026-06-21','BASIC',5,5,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(36,2,4,'2026-06-22','BASIC',6,6,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(37,2,4,'2026-06-23','BASIC',7,7,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(38,2,4,'2026-06-24','BASIC',8,8,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(39,2,4,'2026-06-25','BASIC',9,9,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(40,2,4,'2026-06-26','BASIC',10,10,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(41,2,4,'2026-06-27','SPRING',11,1,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(42,2,4,'2026-06-28','SPRING',12,2,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(43,2,4,'2026-06-29','SPRING',13,3,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(44,2,4,'2026-06-30','SPRING',14,4,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(45,2,4,'2026-07-01','SPRING',15,5,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(46,2,4,'2026-07-02','SPRING',16,6,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(47,2,4,'2026-07-03','SPRING',17,7,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(48,2,4,'2026-07-04','SPRING',18,8,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(49,2,4,'2026-07-05','SPRING',19,9,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(50,2,4,'2026-07-06','AI',20,1,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(51,2,4,'2026-07-07','AI',21,2,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(52,2,4,'2026-07-08','AI',22,3,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(53,2,4,'2026-07-09','AI',23,4,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(54,2,4,'2026-07-10','AI',24,5,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(55,2,4,'2026-07-11','AI',25,6,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(56,2,4,'2026-07-12','AI',26,7,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10'),(57,2,4,'2026-07-13','AI',27,8,'TODO','2026-06-17 09:20:10','2026-06-17 09:20:10');

/*Table structure for table `student_learning_plan` */

DROP TABLE IF EXISTS `student_learning_plan`;

CREATE TABLE `student_learning_plan` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '线上学习计划ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `course_id` bigint NOT NULL COMMENT '课程ID',
  `sop_id` bigint NOT NULL COMMENT 'SOP记录ID',
  `start_date` date NOT NULL COMMENT '开始学习日期',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE生效，CANCELED取消',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_student_learning_plan_student` (`student_id`),
  KEY `idx_student_learning_plan_course` (`course_id`),
  KEY `idx_student_learning_plan_sop` (`sop_id`),
  KEY `idx_student_learning_plan_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='线上学员学习计划表';

/*Data for the table `student_learning_plan` */

insert  into `student_learning_plan`(`id`,`student_id`,`course_id`,`sop_id`,`start_date`,`status`,`created_at`,`updated_at`) values (1,3,2,1,'2026-06-17','ACTIVE','2026-06-17 08:23:18','2026-06-17 08:23:18'),(2,4,2,2,'2026-06-17','ACTIVE','2026-06-17 09:20:10','2026-06-17 09:20:10');

/*Table structure for table `student_product` */

DROP TABLE IF EXISTS `student_product`;

CREATE TABLE `student_product` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学生产品关系ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `product_id` varchar(64) NOT NULL COMMENT '产品ID',
  `source_order_no` varchar(64) NOT NULL COMMENT '来源支付订单号',
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE启用，INACTIVE停用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_source_order_no` (`source_order_no`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生产品关联表';

/*Data for the table `student_product` */

insert  into `student_product`(`id`,`student_id`,`product_id`,`source_order_no`,`status`,`created_at`,`updated_at`) values (1,1,'1','1010202606150912500101415995','ACTIVE','2026-06-15 09:48:07','2026-06-15 09:48:07'),(2,2,'1','1010202606161432560101969312','ACTIVE','2026-06-16 14:43:20','2026-06-16 14:43:20'),(3,3,'2','1010202606162256570101776216','ACTIVE','2026-06-16 22:59:04','2026-06-16 22:59:04'),(4,4,'2','1010202606170909290101671608','ACTIVE','2026-06-17 09:10:14','2026-06-17 09:10:14'),(5,5,'1','1010202606231741220101894209','ACTIVE','2026-06-23 17:42:16','2026-06-23 17:42:16'),(6,6,'1','1010202606232043030101917293','ACTIVE','2026-06-23 21:00:12','2026-06-23 21:00:12'),(7,7,'1','1010202606251915070101814931','ACTIVE','2026-06-25 19:15:11','2026-06-25 19:15:11'),(8,6,'1','1010202606251924230101471105','ACTIVE','2026-06-25 19:24:25','2026-06-25 19:24:25'),(9,8,'1','1010202606251925340101138364','ACTIVE','2026-06-25 19:25:37','2026-06-25 19:25:37'),(10,9,'1','1010202606251927250101197464','ACTIVE','2026-06-25 19:27:27','2026-06-25 19:27:27'),(11,10,'1','1010202606251937420101169795','ACTIVE','2026-06-25 19:37:44','2026-06-25 19:37:44'),(12,11,'1','1010202606251938360101617045','ACTIVE','2026-06-25 19:38:38','2026-06-25 19:38:38'),(13,12,'1','1010202606251940270101743839','ACTIVE','2026-06-25 19:40:29','2026-06-25 19:40:29'),(14,13,'1','1010202606261505340101088073','ACTIVE','2026-06-26 15:09:50','2026-06-26 15:09:50'),(15,14,'2','1010202606262135540101237512','ACTIVE','2026-06-26 21:37:03','2026-06-26 21:37:03'),(16,15,'1','1010202606272101490101177055','ACTIVE','2026-06-27 21:02:20','2026-06-27 21:02:20');

/*Table structure for table `student_sop` */

DROP TABLE IF EXISTS `student_sop`;

CREATE TABLE `student_sop` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学生SOP记录ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `mentor_id` bigint NOT NULL COMMENT '导师用户ID',
  `sop_video_object_key` varchar(255) DEFAULT NULL COMMENT 'SOP视频对象Key',
  `sop_video_file_name` varchar(255) DEFAULT NULL COMMENT 'SOP视频文件名',
  `sop_time` datetime DEFAULT NULL COMMENT 'SOP时间',
  `status` varchar(30) NOT NULL DEFAULT 'ASSIGNED' COMMENT '状态：ASSIGNED已分配，CANCELED已取消',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_student_status` (`student_id`,`status`),
  KEY `idx_mentor_id` (`mentor_id`),
  KEY `idx_sop_time` (`sop_time`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生入学SOP记录表';

/*Data for the table `student_sop` */

insert  into `student_sop`(`id`,`student_id`,`mentor_id`,`sop_video_object_key`,`sop_video_file_name`,`sop_time`,`status`,`remark`,`created_at`,`updated_at`) values (1,3,15,'student/sop/1/20260617/c42aba54-8cd9-4534-879e-dc9819431423.mp4','sg1.mp4','2026-06-17 18:00:00','COMPLETED',NULL,'2026-06-16 23:36:57','2026-06-17 00:23:53'),(2,4,15,'student/sop/2/20260617/bdb01d8f-cc6b-4a08-87e7-c326e6618f2c.mp4','12b9d79803cc40f0a41929084d860e81-55552026-03-23_010716_965.mp4','2026-06-17 09:00:00','COMPLETED',NULL,'2026-06-17 09:10:59','2026-06-17 09:14:46'),(3,14,15,'student/sop/3/20260626/a965f227-cb1d-4b33-a02a-ab1325d5d901.mp4','01.今日内容介绍.mp4','2026-06-26 21:45:00','COMPLETED',NULL,'2026-06-26 21:37:31','2026-06-26 21:44:08');

/*Table structure for table `sys_campus` */

DROP TABLE IF EXISTS `sys_campus`;

CREATE TABLE `sys_campus` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '校区ID',
  `campus_location` varchar(255) NOT NULL COMMENT '校区地点',
  `manager_name` varchar(64) NOT NULL COMMENT '负责人',
  `manager_phone` varchar(32) NOT NULL COMMENT '负责人电话',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='校区表';

/*Data for the table `sys_campus` */

insert  into `sys_campus`(`id`,`campus_location`,`manager_name`,`manager_phone`,`created_at`,`updated_at`) values (1,'杭州市余杭区精诚电力科技园','光头强','13272919301','2026-06-11 14:44:54','2026-06-11 14:44:54'),(2,'杭州市JAVA11班','熊大','166672721192','2026-06-26 09:36:01','2026-06-26 09:36:01');

/*Table structure for table `sys_class` */

DROP TABLE IF EXISTS `sys_class`;

CREATE TABLE `sys_class` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '班级ID',
  `class_period` varchar(64) NOT NULL COMMENT '班级期数',
  `head_teacher_id` bigint NOT NULL COMMENT '班主任ID',
  `campus_id` bigint NOT NULL COMMENT '校区ID',
  `course_id` bigint NOT NULL COMMENT '课程ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_head_teacher_id` (`head_teacher_id`),
  KEY `idx_campus_id` (`campus_id`),
  KEY `idx_course_id` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='班级表';

/*Data for the table `sys_class` */

insert  into `sys_class`(`id`,`class_period`,`head_teacher_id`,`campus_id`,`course_id`,`created_at`,`updated_at`) values (1,'11',8,1,1,'2026-06-11 15:23:33','2026-06-11 15:23:33'),(2,'12',8,1,1,'2026-06-12 16:24:29','2026-06-12 16:24:29'),(4,'10',8,1,1,'2026-06-15 14:53:00','2026-06-15 14:53:00'),(6,'13',8,1,1,'2026-06-16 21:29:32','2026-06-16 21:29:32'),(8,'16',27,1,4,'2026-06-18 14:57:07','2026-06-18 14:57:07'),(9,'21',8,1,1,'2026-06-18 15:26:56','2026-06-18 15:26:56'),(10,'123',8,2,1,'2026-06-26 09:52:08','2026-06-26 09:52:08'),(11,'666',27,2,1,'2026-06-28 22:12:30','2026-06-29 19:00:29'),(12,'13',27,1,1,'2026-06-29 19:01:03','2026-06-29 19:01:03'),(14,'22',8,1,7,'2026-07-21 11:28:12','2026-07-21 13:57:59');

/*Table structure for table `sys_class_duty` */

DROP TABLE IF EXISTS `sys_class_duty`;

CREATE TABLE `sys_class_duty` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '值班ID',
  `class_id` bigint DEFAULT NULL COMMENT '班级ID，校区统一值班为空',
  `campus_id` bigint NOT NULL COMMENT '校区ID',
  `teacher_id` bigint NOT NULL COMMENT '老师ID',
  `duty_date` date NOT NULL COMMENT '值班日期',
  `duty_type` varchar(50) NOT NULL COMMENT '值班类型：EVENING_STUDY_CLASS/EVENING_STUDY_CAMPUS/SELF_STUDY_CLASS',
  `start_time` varchar(10) NOT NULL COMMENT '开始时间',
  `end_time` varchar(10) NOT NULL COMMENT '结束时间',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_class_date` (`class_id`,`duty_date`),
  KEY `idx_campus_date` (`campus_id`,`duty_date`),
  KEY `idx_teacher_date` (`teacher_id`,`duty_date`),
  KEY `idx_duty_type` (`duty_type`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='值班表';

/*Data for the table `sys_class_duty` */

insert  into `sys_class_duty`(`id`,`class_id`,`campus_id`,`teacher_id`,`duty_date`,`duty_type`,`start_time`,`end_time`,`remark`,`created_at`,`updated_at`) values (1,2,1,9,'2026-06-24','EVENING_STUDY_CLASS','19:00','21:00',NULL,'2026-06-13 09:35:38','2026-06-13 09:35:38'),(2,1,1,11,'2026-06-24','EVENING_STUDY_CLASS','19:00','21:00',NULL,'2026-06-13 09:35:38','2026-06-13 09:35:38'),(3,NULL,1,10,'2026-06-24','EVENING_STUDY_CAMPUS','21:00','22:30',NULL,'2026-06-13 09:35:38','2026-06-13 09:35:38'),(5,2,1,9,'2026-06-26','EVENING_STUDY_CLASS','19:00','21:00',NULL,'2026-06-13 09:36:19','2026-06-13 09:36:19'),(6,1,1,10,'2026-06-26','EVENING_STUDY_CLASS','19:00','21:00',NULL,'2026-06-13 09:36:19','2026-06-13 09:36:19'),(7,NULL,1,10,'2026-06-26','EVENING_STUDY_CAMPUS','21:00','22:30',NULL,'2026-06-13 09:36:20','2026-06-13 09:36:20'),(9,2,1,9,'2026-06-01','EVENING_STUDY_CLASS','19:00','21:00',NULL,'2026-06-18 14:17:26','2026-06-18 14:17:26'),(10,6,1,10,'2026-06-01','EVENING_STUDY_CLASS','19:00','21:00',NULL,'2026-06-18 14:17:26','2026-06-18 14:17:26'),(11,4,1,11,'2026-06-01','EVENING_STUDY_CLASS','19:00','21:00',NULL,'2026-06-18 14:17:26','2026-06-18 14:17:26'),(12,NULL,1,12,'2026-06-01','EVENING_STUDY_CAMPUS','21:00','22:30',NULL,'2026-06-18 14:17:26','2026-06-18 14:17:26'),(15,1,1,28,'2026-07-10','EVENING_STUDY_CLASS','19:00','21:00',NULL,'2026-07-22 10:15:13','2026-07-22 10:15:13'),(16,NULL,1,37,'2026-07-10','EVENING_STUDY_CAMPUS','21:00','22:30',NULL,'2026-07-22 10:15:13','2026-07-22 10:15:13'),(17,2,1,37,'2026-06-11','SELF_STUDY_CLASS','09:00','18:00',NULL,'2026-07-22 10:18:14','2026-07-22 10:18:14'),(18,4,1,28,'2026-06-11','SELF_STUDY_CLASS','09:00','18:00',NULL,'2026-07-22 10:18:14','2026-07-22 10:18:14'),(19,6,1,36,'2026-06-11','SELF_STUDY_CLASS','09:00','18:00',NULL,'2026-07-22 10:18:14','2026-07-22 10:18:14'),(20,14,1,9,'2026-06-11','EVENING_STUDY_CLASS','19:00','21:00',NULL,'2026-07-22 10:18:14','2026-07-22 10:18:14'),(21,NULL,1,28,'2026-06-11','EVENING_STUDY_CAMPUS','21:00','22:30',NULL,'2026-07-22 10:18:14','2026-07-22 10:18:14');

/*Table structure for table `sys_class_schedule` */

DROP TABLE IF EXISTS `sys_class_schedule`;

CREATE TABLE `sys_class_schedule` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '课表ID',
  `class_id` bigint NOT NULL COMMENT '班级ID',
  `teacher_id` bigint DEFAULT NULL COMMENT '老师ID',
  `schedule_date` date NOT NULL COMMENT '上课日期',
  `course_detail_id` bigint DEFAULT NULL COMMENT '课程详情ID',
  `course_content` varchar(1000) NOT NULL COMMENT '课程内容',
  `class_type` varchar(32) NOT NULL COMMENT '上课类型：CLASS/SELF_STUDY/HOLIDAY',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_date` (`class_id`,`schedule_date`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_course_detail_id` (`course_detail_id`)
) ENGINE=InnoDB AUTO_INCREMENT=979 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='班级课表表';

/*Data for the table `sys_class_schedule` */

insert  into `sys_class_schedule`(`id`,`class_id`,`teacher_id`,`schedule_date`,`course_detail_id`,`course_content`,`class_type`,`created_at`,`updated_at`) values (1,1,9,'2026-06-16',24,'xxxx','CLASS','2026-06-12 16:20:24','2026-06-12 16:25:46'),(2,1,9,'2026-06-17',25,'xxxx','CLASS','2026-06-12 16:20:24','2026-06-12 16:25:46'),(3,1,NULL,'2026-06-18',NULL,'自习','SELF_STUDY','2026-06-12 16:20:24','2026-06-12 16:20:24'),(4,1,NULL,'2026-06-19',NULL,'端午节','HOLIDAY','2026-06-12 16:20:24','2026-06-12 16:20:24'),(5,1,NULL,'2026-06-20',NULL,'端午节','HOLIDAY','2026-06-12 16:20:24','2026-06-12 16:20:24'),(6,1,NULL,'2026-06-21',NULL,'端午节','HOLIDAY','2026-06-12 16:20:24','2026-06-12 16:20:24'),(7,1,9,'2026-06-22',26,'xxxx','CLASS','2026-06-12 16:20:24','2026-06-12 16:25:46'),(8,1,9,'2026-06-23',27,'xxxx','CLASS','2026-06-12 16:20:24','2026-06-12 16:25:46'),(161,1,10,'2026-06-24',NULL,'xxyy','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(162,1,NULL,'2026-06-25',NULL,'自习','SELF_STUDY','2026-06-12 20:14:22','2026-06-12 20:14:22'),(163,1,10,'2026-06-26',NULL,'加课','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(164,1,10,'2026-06-27',NULL,'自习加课','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(165,1,NULL,'2026-06-28',NULL,'休息','REST','2026-06-12 20:14:22','2026-06-12 20:14:22'),(166,1,9,'2026-06-29',28,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(167,1,9,'2026-06-30',29,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(168,1,9,'2026-07-01',30,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(169,1,NULL,'2026-07-02',NULL,'自习','SELF_STUDY','2026-06-12 20:14:22','2026-06-12 20:14:22'),(170,1,9,'2026-07-03',31,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(171,1,9,'2026-07-04',32,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(172,1,NULL,'2026-07-05',NULL,'休息','REST','2026-06-12 20:14:22','2026-06-12 20:14:22'),(173,1,9,'2026-07-06',33,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(174,1,9,'2026-07-07',34,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(175,1,9,'2026-07-08',35,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(176,1,NULL,'2026-07-09',NULL,'自习','SELF_STUDY','2026-06-12 20:14:22','2026-06-12 20:14:22'),(177,1,9,'2026-07-10',36,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(178,1,9,'2026-07-11',37,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(179,1,NULL,'2026-07-12',NULL,'休息','REST','2026-06-12 20:14:22','2026-06-12 20:14:22'),(180,1,9,'2026-07-13',38,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(181,1,9,'2026-07-14',39,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(182,1,9,'2026-07-15',40,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(183,1,NULL,'2026-07-16',NULL,'自习','SELF_STUDY','2026-06-12 20:14:22','2026-06-12 20:14:22'),(184,1,9,'2026-07-17',41,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(185,1,9,'2026-07-18',42,'xxxx','CLASS','2026-06-12 20:14:22','2026-06-12 20:14:22'),(426,5,NULL,'2026-06-17',24,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(427,5,NULL,'2026-06-18',NULL,'自习','SELF_STUDY','2026-06-16 20:21:06','2026-06-16 20:21:06'),(428,5,NULL,'2026-06-19',NULL,'端午节','HOLIDAY','2026-06-16 20:21:06','2026-06-16 20:21:06'),(429,5,NULL,'2026-06-20',NULL,'端午节','HOLIDAY','2026-06-16 20:21:06','2026-06-16 20:21:06'),(430,5,NULL,'2026-06-21',NULL,'端午节','HOLIDAY','2026-06-16 20:21:06','2026-06-16 20:21:06'),(431,5,NULL,'2026-06-22',25,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(432,5,NULL,'2026-06-23',26,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(433,5,NULL,'2026-06-24',27,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(434,5,NULL,'2026-06-25',NULL,'自习','SELF_STUDY','2026-06-16 20:21:06','2026-06-16 20:21:06'),(435,5,NULL,'2026-06-26',28,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(436,5,NULL,'2026-06-27',29,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(437,5,NULL,'2026-06-28',NULL,'休息','REST','2026-06-16 20:21:06','2026-06-16 20:21:06'),(438,5,NULL,'2026-06-29',30,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(439,5,NULL,'2026-06-30',31,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(440,5,NULL,'2026-07-01',32,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(441,5,NULL,'2026-07-02',NULL,'自习','SELF_STUDY','2026-06-16 20:21:06','2026-06-16 20:21:06'),(442,5,NULL,'2026-07-03',33,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(443,5,NULL,'2026-07-04',34,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(444,5,NULL,'2026-07-05',NULL,'休息','REST','2026-06-16 20:21:06','2026-06-16 20:21:06'),(445,5,NULL,'2026-07-06',35,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(446,5,NULL,'2026-07-07',36,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(447,5,NULL,'2026-07-08',37,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(448,5,NULL,'2026-07-09',NULL,'自习','SELF_STUDY','2026-06-16 20:21:06','2026-06-16 20:21:06'),(449,5,NULL,'2026-07-10',38,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(450,5,NULL,'2026-07-11',39,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(451,5,NULL,'2026-07-12',NULL,'休息','REST','2026-06-16 20:21:06','2026-06-16 20:21:06'),(452,5,NULL,'2026-07-13',40,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(453,5,NULL,'2026-07-14',41,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(454,5,NULL,'2026-07-15',42,'xxxx','CLASS','2026-06-16 20:21:06','2026-06-16 20:21:06'),(484,2,NULL,'2026-06-01',24,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(485,2,NULL,'2026-06-02',23,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(486,2,NULL,'2026-06-03',26,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(487,2,NULL,'2026-06-04',NULL,'自习','SELF_STUDY','2026-06-17 15:37:15','2026-06-17 15:37:15'),(488,2,NULL,'2026-06-05',27,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(489,2,NULL,'2026-06-06',28,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(490,2,NULL,'2026-06-07',NULL,'休息','REST','2026-06-17 15:37:15','2026-06-17 15:37:15'),(491,2,NULL,'2026-06-08',29,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(492,2,NULL,'2026-06-09',30,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(493,2,NULL,'2026-06-10',31,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(494,2,NULL,'2026-06-11',NULL,'自习','SELF_STUDY','2026-06-17 15:37:15','2026-06-17 15:37:15'),(495,2,NULL,'2026-06-12',32,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(496,2,NULL,'2026-06-13',33,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(497,2,NULL,'2026-06-14',NULL,'休息','REST','2026-06-17 15:37:15','2026-06-17 15:37:15'),(498,2,NULL,'2026-06-15',34,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(499,2,NULL,'2026-06-16',35,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(500,2,NULL,'2026-06-17',36,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(501,2,NULL,'2026-06-18',NULL,'自习','SELF_STUDY','2026-06-17 15:37:15','2026-06-17 15:37:15'),(502,2,NULL,'2026-06-19',NULL,'端午节','HOLIDAY','2026-06-17 15:37:15','2026-06-17 15:37:15'),(503,2,NULL,'2026-06-20',NULL,'端午节','HOLIDAY','2026-06-17 15:37:15','2026-06-17 15:37:15'),(504,2,NULL,'2026-06-21',NULL,'端午节','HOLIDAY','2026-06-17 15:37:15','2026-06-17 15:37:15'),(505,2,NULL,'2026-06-22',37,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(506,2,NULL,'2026-06-23',38,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(507,2,NULL,'2026-06-24',39,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(508,2,NULL,'2026-06-25',NULL,'自习','SELF_STUDY','2026-06-17 15:37:15','2026-06-17 15:37:15'),(509,2,NULL,'2026-06-26',40,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(510,2,NULL,'2026-06-27',41,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(511,2,NULL,'2026-06-28',NULL,'休息','REST','2026-06-17 15:37:15','2026-06-17 15:37:15'),(512,2,NULL,'2026-06-29',42,'xxxx','CLASS','2026-06-17 15:37:15','2026-06-17 15:37:15'),(543,6,11,'2026-06-01',NULL,'aa','CLASS','2026-06-17 19:20:37','2026-06-17 19:20:37'),(544,6,NULL,'2026-06-02',24,'xxxx','CLASS','2026-06-17 19:20:37','2026-06-17 19:20:37'),(545,6,NULL,'2026-06-03',23,'xxxx','CLASS','2026-06-17 19:20:37','2026-06-17 19:20:37'),(573,6,12,'2026-06-04',NULL,'aa','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(574,6,NULL,'2026-06-05',26,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(575,6,NULL,'2026-06-06',27,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(576,6,NULL,'2026-06-07',NULL,'休息','REST','2026-06-17 19:22:40','2026-06-17 19:22:40'),(577,6,NULL,'2026-06-08',28,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(578,6,NULL,'2026-06-09',29,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(579,6,NULL,'2026-06-10',30,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(580,6,NULL,'2026-06-11',NULL,'自习','SELF_STUDY','2026-06-17 19:22:40','2026-06-17 19:22:40'),(581,6,NULL,'2026-06-12',31,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(582,6,NULL,'2026-06-13',32,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(583,6,NULL,'2026-06-14',NULL,'休息','REST','2026-06-17 19:22:40','2026-06-17 19:22:40'),(584,6,NULL,'2026-06-15',33,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(585,6,NULL,'2026-06-16',34,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(586,6,NULL,'2026-06-17',35,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(587,6,NULL,'2026-06-18',NULL,'自习','SELF_STUDY','2026-06-17 19:22:40','2026-06-17 19:22:40'),(588,6,NULL,'2026-06-19',NULL,'端午节','HOLIDAY','2026-06-17 19:22:40','2026-06-17 19:22:40'),(589,6,NULL,'2026-06-20',NULL,'端午节','HOLIDAY','2026-06-17 19:22:40','2026-06-17 19:22:40'),(590,6,NULL,'2026-06-21',NULL,'端午节','HOLIDAY','2026-06-17 19:22:40','2026-06-17 19:22:40'),(591,6,NULL,'2026-06-22',36,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(592,6,NULL,'2026-06-23',37,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(593,6,NULL,'2026-06-24',38,'xxxx','CLASS','2026-06-17 19:22:40','2026-06-17 19:22:40'),(594,6,37,'2026-06-25',NULL,'许仙先','CLASS','2026-06-17 19:22:40','2026-07-21 17:18:38'),(595,6,NULL,'2026-06-28',39,'xxxx','CLASS','2026-06-17 19:22:40','2026-07-21 17:26:20'),(596,6,NULL,'2026-06-29',40,'xxxx','CLASS','2026-06-17 19:22:40','2026-07-21 17:26:20'),(802,7,NULL,'2026-06-22',511,'1','CLASS','2026-06-18 14:38:00','2026-06-18 14:38:00'),(803,7,NULL,'2026-06-23',512,'111','CLASS','2026-06-18 14:38:00','2026-06-18 14:38:00'),(804,7,NULL,'2026-06-24',513,'111','CLASS','2026-06-18 14:38:00','2026-06-18 14:38:00'),(805,7,NULL,'2026-06-25',NULL,'自习','SELF_STUDY','2026-06-18 14:38:00','2026-06-18 14:38:00'),(806,7,NULL,'2026-06-26',514,'111','CLASS','2026-06-18 14:38:00','2026-06-18 14:38:00'),(807,7,NULL,'2026-06-27',515,'111','CLASS','2026-06-18 14:38:00','2026-06-18 14:38:00'),(808,7,NULL,'2026-06-28',NULL,'休息','REST','2026-06-18 14:38:00','2026-06-18 14:38:00'),(809,7,NULL,'2026-06-29',516,'111','CLASS','2026-06-18 14:38:00','2026-06-18 14:38:00'),(810,7,NULL,'2026-06-30',517,'111','CLASS','2026-06-18 14:38:00','2026-06-18 14:38:00'),(811,8,12,'2026-06-23',519,'111','CLASS','2026-06-18 14:57:38','2026-06-18 15:08:46'),(814,6,28,'2026-06-30',NULL,'py天虹、','CLASS','2026-06-18 15:00:46','2026-07-21 17:26:20'),(815,6,NULL,'2026-07-01',41,'xxxx','CLASS','2026-06-18 15:00:46','2026-07-21 17:26:20'),(816,6,28,'2026-07-02',NULL,'python','CLASS','2026-06-18 15:00:46','2026-07-21 17:26:20'),(817,6,NULL,'2026-07-03',42,'xxxx','CLASS','2026-06-18 15:00:46','2026-07-21 17:26:20'),(818,9,28,'2026-06-22',511,'1','CLASS','2026-06-18 15:40:31','2026-06-18 15:41:49'),(819,9,28,'2026-06-23',512,'111','CLASS','2026-06-18 15:40:31','2026-06-18 15:41:49'),(820,9,11,'2026-06-24',513,'111','CLASS','2026-06-18 15:40:31','2026-06-18 15:41:49'),(821,9,NULL,'2026-06-25',NULL,'自习','SELF_STUDY','2026-06-18 15:40:31','2026-06-18 15:40:31'),(822,9,11,'2026-06-26',514,'111','CLASS','2026-06-18 15:40:31','2026-06-18 15:41:49'),(823,9,11,'2026-06-27',515,'111','CLASS','2026-06-18 15:40:31','2026-06-18 15:41:48'),(824,9,NULL,'2026-06-28',NULL,'休息','REST','2026-06-18 15:40:31','2026-06-18 15:40:31'),(825,9,11,'2026-06-29',516,'111','CLASS','2026-06-18 15:40:31','2026-06-18 15:41:48'),(826,9,11,'2026-06-30',517,'111','CLASS','2026-06-18 15:40:31','2026-06-18 15:41:48'),(847,11,NULL,'2026-06-29',561,'c++基础','CLASS','2026-06-29 18:58:57','2026-06-29 18:58:57'),(848,10,NULL,'2026-06-17',511,'1','CLASS','2026-06-29 18:59:25','2026-06-29 18:59:25'),(849,10,NULL,'2026-06-18',NULL,'自习','SELF_STUDY','2026-06-29 18:59:25','2026-06-29 18:59:25'),(850,10,NULL,'2026-06-19',NULL,'端午节','HOLIDAY','2026-06-29 18:59:25','2026-06-29 18:59:25'),(851,10,NULL,'2026-06-20',NULL,'端午节','HOLIDAY','2026-06-29 18:59:25','2026-06-29 18:59:25'),(852,10,NULL,'2026-06-21',NULL,'端午节','HOLIDAY','2026-06-29 18:59:25','2026-06-29 18:59:25'),(853,10,NULL,'2026-06-22',512,'111','CLASS','2026-06-29 18:59:25','2026-06-29 18:59:25'),(854,10,NULL,'2026-06-23',513,'111','CLASS','2026-06-29 18:59:25','2026-06-29 18:59:25'),(855,10,NULL,'2026-06-24',514,'111','CLASS','2026-06-29 18:59:25','2026-06-29 18:59:25'),(856,10,NULL,'2026-06-25',NULL,'自习','SELF_STUDY','2026-06-29 18:59:25','2026-06-29 18:59:25'),(857,10,NULL,'2026-06-26',515,'111','CLASS','2026-06-29 18:59:25','2026-06-29 18:59:25'),(858,10,NULL,'2026-06-27',516,'111','CLASS','2026-06-29 18:59:25','2026-06-29 18:59:25'),(859,10,NULL,'2026-06-28',NULL,'休息','REST','2026-06-29 18:59:25','2026-06-29 18:59:25'),(860,10,NULL,'2026-06-29',517,'111','CLASS','2026-06-29 18:59:25','2026-06-29 18:59:25'),(861,12,NULL,'2026-06-29',511,'1','CLASS','2026-06-29 19:01:16','2026-06-29 19:01:16'),(862,12,NULL,'2026-06-30',512,'111','CLASS','2026-06-29 19:01:16','2026-06-29 19:01:16'),(863,12,NULL,'2026-07-01',513,'111','CLASS','2026-06-29 19:01:16','2026-06-29 19:01:16'),(864,12,NULL,'2026-07-02',NULL,'自习','SELF_STUDY','2026-06-29 19:01:16','2026-06-29 19:01:16'),(865,12,NULL,'2026-07-03',514,'111','CLASS','2026-06-29 19:01:16','2026-06-29 19:01:16'),(866,12,NULL,'2026-07-04',515,'111','CLASS','2026-06-29 19:01:16','2026-06-29 19:01:16'),(867,12,NULL,'2026-07-05',NULL,'休息','REST','2026-06-29 19:01:16','2026-06-29 19:01:16'),(868,12,NULL,'2026-07-06',516,'111','CLASS','2026-06-29 19:01:16','2026-06-29 19:01:16'),(869,12,NULL,'2026-07-07',517,'111','CLASS','2026-06-29 19:01:16','2026-06-29 19:01:16'),(907,13,10,'2026-06-30',NULL,'121','CLASS','2026-06-29 21:11:32','2026-06-29 21:11:32'),(908,13,11,'2026-07-01',511,'1','CLASS','2026-06-29 21:11:32','2026-07-05 22:48:21'),(909,13,NULL,'2026-07-02',NULL,'自习','SELF_STUDY','2026-06-29 21:11:32','2026-06-29 21:11:32'),(910,13,11,'2026-07-03',512,'111','CLASS','2026-06-29 21:11:32','2026-07-05 22:48:21'),(911,13,10,'2026-07-04',513,'111','CLASS','2026-06-29 21:11:32','2026-07-05 22:48:21'),(912,13,NULL,'2026-07-05',NULL,'休息','REST','2026-06-29 21:11:32','2026-06-29 21:11:32'),(913,13,10,'2026-07-06',514,'111','CLASS','2026-06-29 21:11:32','2026-07-05 22:48:21'),(914,13,11,'2026-07-07',515,'111','CLASS','2026-06-29 21:11:32','2026-07-05 22:48:21'),(915,13,11,'2026-07-08',516,'111','CLASS','2026-06-29 21:11:32','2026-07-05 22:48:21'),(916,13,NULL,'2026-07-09',NULL,'自习','SELF_STUDY','2026-06-29 21:11:32','2026-06-29 21:11:32'),(917,13,11,'2026-07-10',517,'111','CLASS','2026-06-29 21:11:32','2026-07-05 22:48:21'),(936,14,9,'2026-06-10',597,'开班说明、环境搭建、项目结构介绍','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(937,14,36,'2026-06-11',NULL,'这是我新增的课程,自习日, 直接修改成上课','CLASS','2026-07-21 15:05:36','2026-07-21 17:11:36'),(938,14,9,'2026-06-12',598,'Spring Boot 接口开发与统一响应','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(939,14,9,'2026-06-13',599,'MyBatis 基础查询与新增课程详情','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(940,14,NULL,'2026-06-14',NULL,'休息日','REST','2026-07-21 15:05:36','2026-07-21 15:05:36'),(941,14,9,'2026-06-15',600,'课程详情修改、删除与参数校验','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(942,14,10,'2026-06-16',601,'Excel 导入课程详情与批量入库','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(943,14,10,'2026-06-17',602,'班级管理与课程关联','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(944,14,NULL,'2026-06-18',NULL,'自习日','SELF_STUDY','2026-07-21 15:05:36','2026-07-21 15:05:36'),(945,14,NULL,'2026-06-19',NULL,'端午节','HOLIDAY','2026-07-21 15:05:36','2026-07-21 15:05:36'),(946,14,NULL,'2026-06-20',NULL,'端午节','HOLIDAY','2026-07-21 15:05:36','2026-07-21 15:05:36'),(947,14,NULL,'2026-06-21',NULL,'端午节','HOLIDAY','2026-07-21 15:05:36','2026-07-21 15:05:36'),(948,14,10,'2026-06-22',603,'课表生成规则与节假日处理','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(949,14,36,'2026-06-23',604,'阶段老师分配与冲突校验','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(950,14,36,'2026-06-24',605,'值班管理业务实现','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(951,14,NULL,'2026-06-25',NULL,'自习日','SELF_STUDY','2026-07-21 15:05:36','2026-07-21 15:05:36'),(952,14,36,'2026-06-26',606,'教学管理模块联调与验收','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(953,14,36,'2026-06-27',607,'教学管理模块联调与验收11','CLASS','2026-07-21 15:05:36','2026-07-21 16:07:00'),(954,14,9,'2026-07-24',NULL,'xxx','CLASS','2026-07-21 17:13:29','2026-07-21 17:13:29'),(955,6,37,'2026-06-27',NULL,'这次一定要成功~','CLASS','2026-07-21 17:25:19','2026-07-21 17:26:20'),(956,6,37,'2026-06-26',NULL,'小新出场, 必定成功','CLASS','2026-07-21 17:26:20','2026-07-21 17:26:20'),(967,4,37,'2026-06-01',NULL,'到达','CLASS','2026-07-21 17:37:19','2026-07-21 17:37:19'),(968,4,37,'2026-06-02',NULL,'许仙先','CLASS','2026-07-21 17:37:19','2026-07-21 17:37:19'),(969,4,NULL,'2026-06-03',297,'333','CLASS','2026-07-21 17:37:19','2026-07-21 17:37:19'),(970,4,NULL,'2026-06-04',NULL,'自习日','SELF_STUDY','2026-07-21 17:37:19','2026-07-21 17:37:19'),(971,4,NULL,'2026-06-05',298,'xxxx','CLASS','2026-07-21 17:37:19','2026-07-21 17:37:19'),(972,4,NULL,'2026-06-06',299,'xxxx','CLASS','2026-07-21 17:37:19','2026-07-21 17:37:19'),(973,4,NULL,'2026-06-07',NULL,'休息日','REST','2026-07-21 17:37:19','2026-07-21 17:37:19'),(974,4,NULL,'2026-06-08',300,'xxxx','CLASS','2026-07-21 17:37:19','2026-07-21 17:37:19'),(975,4,NULL,'2026-06-09',301,'xxxx','CLASS','2026-07-21 17:37:19','2026-07-21 17:37:19'),(976,4,NULL,'2026-06-10',302,'xxxx','CLASS','2026-07-21 17:37:19','2026-07-21 17:37:19'),(977,4,NULL,'2026-06-11',NULL,'自习日','SELF_STUDY','2026-07-21 17:37:19','2026-07-21 17:37:19'),(978,4,NULL,'2026-06-12',303,'ygyg','CLASS','2026-07-21 17:37:19','2026-07-21 17:37:19');

/*Table structure for table `sys_config` */

DROP TABLE IF EXISTS `sys_config`;

CREATE TABLE `sys_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `k` varchar(100) NOT NULL COMMENT '配置Key',
  `v` varchar(500) NOT NULL COMMENT '配置Value',
  PRIMARY KEY (`id`),
  UNIQUE KEY `k` (`k`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统配置表';

/*Data for the table `sys_config` */

insert  into `sys_config`(`id`,`k`,`v`) values (8,'jwtSecret','180000001'),(9,'student.tag.options','普通学员,摆烂学员,失联学员,已就业学员,高潜力学员,持续关注学员,退学学员'),(10,'teaching.schedule.rule','{\n  \"classDays\": [1, 2, 3, 5, 6],\n  \"selfStudyDays\": [4],\n  \"restDays\": [7],\n  \"holidayRest\": true\n}');

/*Table structure for table `sys_course` */

DROP TABLE IF EXISTS `sys_course`;

CREATE TABLE `sys_course` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '课程ID',
  `course_name` varchar(128) NOT NULL COMMENT '课程名称',
  `course_days` int NOT NULL COMMENT '课程天数',
  `teaching_mode` varchar(20) NOT NULL DEFAULT 'ONLINE' COMMENT '上课方式：ONLINE线上，OFFLINE线下',
  `material_path` varchar(500) NOT NULL COMMENT '资料路径',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='课程表';

/*Data for the table `sys_course` */

insert  into `sys_course`(`id`,`course_name`,`course_days`,`teaching_mode`,`material_path`,`created_at`,`updated_at`) values (1,'JAVA+AI课程',100,'OFFLINE','xx','2026-06-11 15:02:36','2026-06-17 00:36:33'),(4,'python',7,'OFFLINE','111','2026-06-18 14:56:45','2026-06-18 14:56:45'),(5,'AI大模型',100,'ONLINE','www.kkzuishuai.com','2026-06-26 21:47:03','2026-06-26 21:47:03'),(6,'C++',90,'OFFLINE','www.feishu.ziliao.com','2026-06-28 22:10:30','2026-06-28 22:10:30'),(7,'java+ai+aigent',120,'OFFLINE','http://www.baidu.com','2026-07-20 17:02:37','2026-07-21 13:59:49');

/*Table structure for table `sys_course_detail` */

DROP TABLE IF EXISTS `sys_course_detail`;

CREATE TABLE `sys_course_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '课程详情ID',
  `course_id` bigint NOT NULL COMMENT '课程ID',
  `stage_name` varchar(128) NOT NULL COMMENT '阶段',
  `day_number` int DEFAULT NULL COMMENT '第几天，线下课程使用',
  `class_content` varchar(1000) DEFAULT NULL COMMENT '上课内容，线下课程使用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_course_id` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=608 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='课程详情表';

/*Data for the table `sys_course_detail` */

insert  into `sys_course_detail`(`id`,`course_id`,`stage_name`,`day_number`,`class_content`,`created_at`,`updated_at`) values (511,1,'BASIC',1,'1','2026-06-18 14:14:12','2026-06-18 14:14:12'),(512,1,'BASIC',2,'111','2026-06-18 14:14:12','2026-06-18 14:14:12'),(513,1,'AI',4,'111','2026-06-18 14:14:12','2026-07-20 17:29:13'),(514,1,'AI',5,'111','2026-06-18 14:14:12','2026-07-20 17:29:13'),(515,1,'SPRING',6,'111','2026-06-18 14:14:12','2026-07-20 17:29:13'),(516,1,'SPRING',7,'111','2026-06-18 14:14:12','2026-07-20 17:29:13'),(517,1,'SPRING',8,'111','2026-06-18 14:14:12','2026-07-20 17:29:13'),(519,4,'一',1,'111','2026-06-18 14:57:24','2026-06-18 14:57:24'),(522,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(523,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(524,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(525,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(526,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(527,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(528,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(529,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(530,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(531,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(532,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(533,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(534,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(535,5,'python',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(536,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(537,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(538,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(539,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(540,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(541,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(542,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(543,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(544,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(545,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(546,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(547,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(548,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(549,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(550,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(551,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(552,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(553,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(554,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(555,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(556,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(557,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(558,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(559,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(560,5,'AI',NULL,NULL,'2026-06-26 22:24:45','2026-06-26 22:24:45'),(565,1,'AI',3,'这是我新增的第三天内容, 看原来的第三天是否后移动了呢?','2026-07-20 17:29:13','2026-07-20 17:29:13'),(586,6,'基础阶段',1,'开班说明、环境搭建、项目结构介绍','2026-07-21 10:10:27','2026-07-21 10:10:27'),(587,6,'基础阶段',2,'Spring Boot 接口开发与统一响应','2026-07-21 10:10:27','2026-07-21 10:10:27'),(588,6,'基础阶段',3,'MyBatis 基础查询与新增课程详情','2026-07-21 10:10:27','2026-07-21 10:10:27'),(589,6,'基础阶段',4,'课程详情修改、删除与参数校验','2026-07-21 10:10:27','2026-07-21 10:10:27'),(590,6,'进阶阶段',5,'Excel 导入课程详情与批量入库','2026-07-21 10:10:27','2026-07-21 10:10:27'),(591,6,'进阶阶段',6,'班级管理与课程关联','2026-07-21 10:10:27','2026-07-21 10:10:27'),(592,6,'进阶阶段',7,'课表生成规则与节假日处理','2026-07-21 10:10:27','2026-07-21 10:10:27'),(593,6,'项目阶段',8,'阶段老师分配与冲突校验','2026-07-21 10:10:27','2026-07-21 10:10:27'),(594,6,'项目阶段',9,'值班管理业务实现','2026-07-21 10:10:27','2026-07-21 10:10:27'),(595,6,'项目阶段',10,'教学管理模块联调与验收','2026-07-21 10:10:27','2026-07-21 10:10:27'),(596,6,'项目阶段',11,'教学管理模块联调与验收11','2026-07-21 10:10:27','2026-07-21 10:10:27'),(597,7,'基础阶段',1,'开班说明、环境搭建、项目结构介绍','2026-07-21 15:04:16','2026-07-21 15:04:16'),(598,7,'基础阶段',2,'Spring Boot 接口开发与统一响应','2026-07-21 15:04:16','2026-07-21 15:04:16'),(599,7,'基础阶段',3,'MyBatis 基础查询与新增课程详情','2026-07-21 15:04:16','2026-07-21 15:04:16'),(600,7,'基础阶段',4,'课程详情修改、删除与参数校验','2026-07-21 15:04:16','2026-07-21 15:04:16'),(601,7,'进阶阶段',5,'Excel 导入课程详情与批量入库','2026-07-21 15:04:16','2026-07-21 15:04:16'),(602,7,'进阶阶段',6,'班级管理与课程关联','2026-07-21 15:04:16','2026-07-21 15:04:16'),(603,7,'进阶阶段',7,'课表生成规则与节假日处理','2026-07-21 15:04:16','2026-07-21 15:04:16'),(604,7,'项目阶段',8,'阶段老师分配与冲突校验','2026-07-21 15:04:16','2026-07-21 15:04:16'),(605,7,'项目阶段',9,'值班管理业务实现','2026-07-21 15:04:16','2026-07-21 15:04:16'),(606,7,'项目阶段',10,'教学管理模块联调与验收','2026-07-21 15:04:16','2026-07-21 15:04:16'),(607,7,'项目阶段',11,'教学管理模块联调与验收11','2026-07-21 15:04:16','2026-07-21 15:04:16');

/*Table structure for table `sys_permission` */

DROP TABLE IF EXISTS `sys_permission`;

CREATE TABLE `sys_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `parent_id` bigint NOT NULL DEFAULT '0' COMMENT '父权限ID，根节点为0',
  `permission_code` varchar(100) NOT NULL COMMENT '权限编码',
  `permission_name` varchar(100) NOT NULL COMMENT '权限名称',
  `permission_type` varchar(32) NOT NULL COMMENT '权限类型，例如API、MENU、BUTTON',
  `api_path` varchar(255) DEFAULT NULL COMMENT 'API路径匹配规则，仅API权限使用',
  `sort_num` int NOT NULL DEFAULT '0' COMMENT '排序值，越小越靠前',
  `description` varchar(255) DEFAULT NULL COMMENT '权限描述',
  `status` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_code` (`permission_code`),
  UNIQUE KEY `uk_permission_code` (`permission_code`)
) ENGINE=InnoDB AUTO_INCREMENT=409 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='权限表';

/*Data for the table `sys_permission` */

insert  into `sys_permission`(`id`,`parent_id`,`permission_code`,`permission_name`,`permission_type`,`api_path`,`sort_num`,`description`,`status`,`created_at`,`updated_at`) values (355,0,'system','系统管理','MENU',NULL,10,'系统管理根节点','ACTIVE','2026-06-11 09:55:09','2026-06-11 09:55:09'),(356,355,'system:user','用户管理','MENU',NULL,1010,'用户管理页面','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(357,355,'system:role','角色管理','MENU',NULL,1020,'角色管理页面','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(358,355,'system:permission','权限管理','MENU',NULL,1030,'权限管理页面','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(359,356,'api:user:page','分页查询用户','API','/yq-admin/api/sysUser',1111,'分页查询用户接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(360,356,'api:user:detail','查询用户详情','API','/yq-admin/api/sysUser/{id}',1112,'根据ID查询用户接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(361,356,'api:user:create','新增用户','API','/yq-admin/api/sysUser',1113,'新增用户接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(362,356,'api:user:update','修改用户','API','/yq-admin/api/sysUser/{id}',1114,'修改用户接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(363,356,'api:user:delete','删除用户','API','/yq-admin/api/sysUser/{id}',1115,'删除用户接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(364,356,'api:user:assign-role','用户分配角色','API','/yq-admin/api/sysUser/{id}/roles',1116,'用户分配角色接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(365,357,'api:role:page','分页查询角色','API','/yq-admin/api/sysRole',1121,'分页查询角色接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(366,357,'api:role:detail','查询角色详情','API','/yq-admin/api/sysRole/{id}',1122,'根据ID查询角色接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(367,357,'api:role:create','新增角色','API','/yq-admin/api/sysRole',1123,'新增角色接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(368,357,'api:role:update','修改角色','API','/yq-admin/api/sysRole/{id}',1124,'修改角色接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(369,357,'api:role:delete','删除角色','API','/yq-admin/api/sysRole/{id}',1125,'删除角色接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(370,357,'api:role:assign-permission','角色分配权限','API','/yq-admin/api/sysRole/{id}/permissions',1126,'角色分配权限接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(371,358,'api:permission:page','分页查询权限','API','/yq-admin/api/sysPermission',1131,'分页查询权限接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(372,358,'api:permission:detail','查询权限详情','API','/yq-admin/api/sysPermission/{id}',1132,'根据ID查询权限接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(373,358,'api:permission:create','新增权限','API','/yq-admin/api/sysPermission',1133,'新增权限接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(374,358,'api:permission:update','修改权限','API','/yq-admin/api/sysPermission/{id}',1134,'修改权限接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(375,358,'api:permission:delete','删除权限','API','/yq-admin/api/sysPermission/{id}',1135,'删除权限接口','ACTIVE','2026-06-11 09:55:10','2026-06-11 09:55:10'),(376,0,'student','学生管理','MENU',NULL,30,'学生管理根菜单','ACTIVE','2026-06-23 21:33:19','2026-06-26 15:59:00'),(377,376,'student:dorm','宿舍管理','MENU',NULL,3060,'学生宿舍管理页面','ACTIVE','2026-06-23 21:33:19','2026-06-26 15:59:00'),(378,377,'api:student-dorm:detail','查询学生宿舍','API','/yq-admin/api/dorm/students/{studentId}',2181,'查询学生宿舍接口','ACTIVE','2026-06-23 21:33:19','2026-06-26 15:59:00'),(379,377,'api:student-dorm:assign','调整学生宿舍','API','/yq-admin/api/dorm/students/{studentId}',2182,'班主任调整学生宿舍接口','ACTIVE','2026-06-23 21:33:19','2026-06-26 15:59:00'),(382,377,'api:student-dorm-bill:create','创建宿舍缴费账单','API','/yq-admin/api/dorm/students/{studentId}/bills',2183,'创建学生宿舍缴费账单接口','ACTIVE','2026-06-26 15:59:00','2026-06-26 15:59:00'),(385,0,'dorm','宿舍管理','MENU',NULL,6000,'宿舍管理模块','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(386,385,'dorm:building','宿舍楼栋1','MENU',NULL,6010,'宿舍楼栋管理页面1111','ACTIVE','2026-06-26 17:40:28','2026-07-20 11:45:25'),(387,385,'dorm:room','宿舍房间','MENU',NULL,6020,'宿舍房间管理页面','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(388,385,'dorm:bed','宿舍床位','MENU',NULL,6030,'宿舍床位管理页面','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(389,385,'dorm:assignment','入住管理','MENU',NULL,6040,'宿舍入住分配页面','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(390,386,'api:dorm-building:page','分页查询宿舍楼栋','API','/yq-admin/api/dorm/building',6011,'分页查询宿舍楼栋接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(391,386,'api:dorm-building:detail','查询宿舍楼栋详情','API','/yq-admin/api/dorm/building/{id}',6012,'根据ID查询宿舍楼栋接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(392,386,'api:dorm-building:create','新增宿舍楼栋','API','/yq-admin/api/dorm/building',6013,'新增宿舍楼栋接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(393,386,'api:dorm-building:update','修改宿舍楼栋','API','/yq-admin/api/dorm/building/{id}',6014,'修改宿舍楼栋接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(394,386,'api:dorm-building:delete','删除宿舍楼栋','API','/yq-admin/api/dorm/building/{id}',6015,'删除宿舍楼栋接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(395,387,'api:dorm-room:page','分页查询宿舍房间','API','/yq-admin/api/dorm/room',6021,'分页查询宿舍房间接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(396,387,'api:dorm-room:detail','查询宿舍房间详情','API','/yq-admin/api/dorm/room/{id}',6022,'根据ID查询宿舍房间接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(397,387,'api:dorm-room:create','新增宿舍房间','API','/yq-admin/api/dorm/room',6023,'新增宿舍房间接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(398,387,'api:dorm-room:update','修改宿舍房间','API','/yq-admin/api/dorm/room/{id}',6024,'修改宿舍房间接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(399,387,'api:dorm-room:delete','删除宿舍房间','API','/yq-admin/api/dorm/room/{id}',6025,'删除宿舍房间接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(400,388,'api:dorm-bed:page','分页查询宿舍床位','API','/yq-admin/api/dorm/bed',6031,'分页查询宿舍床位接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(401,388,'api:dorm-bed:detail','查询宿舍床位详情','API','/yq-admin/api/dorm/bed/{id}',6032,'根据ID查询宿舍床位接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(402,388,'api:dorm-bed:create','新增宿舍床位','API','/yq-admin/api/dorm/bed',6033,'新增宿舍床位接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(403,388,'api:dorm-bed:update','修改宿舍床位','API','/yq-admin/api/dorm/bed/{id}',6034,'修改宿舍床位接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(404,388,'api:dorm-bed:delete','删除宿舍床位','API','/yq-admin/api/dorm/bed/{id}',6035,'删除宿舍床位接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(405,389,'api:dorm-assignment:page','分页查询入住记录','API','/yq-admin/api/dorm/assignment',6041,'分页查询入住记录接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(406,389,'api:dorm-assignment:assign','入住分配','API','/yq-admin/api/dorm/assignment/assign',6042,'入住分配接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(407,389,'api:dorm-assignment:checkout','退宿','API','/yq-admin/api/dorm/assignment/{id}/checkout',6043,'退宿接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28'),(408,389,'api:dorm-assignment:transfer','调宿','API','/yq-admin/api/dorm/assignment/transfer',6044,'调宿接口','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28');

/*Table structure for table `sys_role` */

DROP TABLE IF EXISTS `sys_role`;

CREATE TABLE `sys_role` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_code` varchar(64) NOT NULL COMMENT '角色编码',
  `role_name` varchar(64) NOT NULL COMMENT '角色名称',
  `description` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `status` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_code` (`role_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色表';

/*Data for the table `sys_role` */

insert  into `sys_role`(`id`,`role_code`,`role_name`,`description`,`status`,`created_at`,`updated_at`) values (4,'SUPER_ADMIN','超级管理员','满转质干同个以放且。展车易张海交产林。在农影干。论素天从动解严米与难。县报定即复完清斗性。','ACTIVE','2026-06-10 15:46:51','2026-06-11 09:47:51'),(5,'HEAD_TEACHER','班主任',NULL,'ACTIVE','2026-06-11 15:19:55','2026-06-11 15:20:13'),(6,'TEACHER','讲师','这是一个讲师角色1','ACTIVE','2026-06-12 11:20:59','2026-07-20 11:19:30'),(7,'ADVISOR','导师',NULL,'ACTIVE','2026-06-16 23:34:49','2026-06-16 23:34:49'),(8,'DORM_MANAGER','宿管员','负责宿舍楼栋、房间、床位与入住分配管理','ACTIVE','2026-06-26 17:40:28','2026-06-26 17:40:28');

/*Table structure for table `sys_role_permission` */

DROP TABLE IF EXISTS `sys_role_permission`;

CREATE TABLE `sys_role_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `permission_id` bigint NOT NULL COMMENT '权限ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=205 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色权限关联表';

/*Data for the table `sys_role_permission` */

insert  into `sys_role_permission`(`id`,`role_id`,`permission_id`,`created_at`) values (161,5,379,'2026-06-23 21:33:19'),(162,5,378,'2026-06-23 21:33:19'),(163,5,377,'2026-06-23 21:33:19'),(164,5,382,'2026-06-26 15:59:00'),(167,8,406,'2026-06-26 17:40:28'),(168,8,407,'2026-06-26 17:40:28'),(169,8,405,'2026-06-26 17:40:28'),(170,8,408,'2026-06-26 17:40:28'),(171,8,402,'2026-06-26 17:40:28'),(172,8,404,'2026-06-26 17:40:28'),(173,8,401,'2026-06-26 17:40:28'),(174,8,400,'2026-06-26 17:40:28'),(175,8,403,'2026-06-26 17:40:28'),(176,8,392,'2026-06-26 17:40:28'),(177,8,394,'2026-06-26 17:40:28'),(178,8,391,'2026-06-26 17:40:28'),(179,8,390,'2026-06-26 17:40:28'),(180,8,393,'2026-06-26 17:40:28'),(181,8,397,'2026-06-26 17:40:28'),(182,8,399,'2026-06-26 17:40:28'),(183,8,396,'2026-06-26 17:40:28'),(184,8,395,'2026-06-26 17:40:28'),(185,8,398,'2026-06-26 17:40:28'),(186,8,385,'2026-06-26 17:40:28'),(187,8,389,'2026-06-26 17:40:28'),(188,8,388,'2026-06-26 17:40:28'),(189,8,386,'2026-06-26 17:40:28'),(190,8,387,'2026-06-26 17:40:28'),(202,7,357,'2026-07-20 11:43:56'),(203,7,359,'2026-07-20 11:43:56'),(204,7,360,'2026-07-20 11:43:56');

/*Table structure for table `sys_user` */

DROP TABLE IF EXISTS `sys_user`;

CREATE TABLE `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(64) NOT NULL COMMENT '登录用户名',
  `password` varchar(255) NOT NULL COMMENT '登录密码，BCrypt加密',
  `nickname` varchar(64) NOT NULL COMMENT '用户昵称',
  `real_name` varchar(64) DEFAULT NULL COMMENT '真实姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `email` varchar(128) DEFAULT NULL COMMENT '邮箱',
  `union_id` varchar(128) DEFAULT NULL COMMENT '飞书 union_id',
  `status` varchar(128) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `union_id` (`union_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户表';

/*Data for the table `sys_user` */

insert  into `sys_user`(`id`,`username`,`password`,`nickname`,`real_name`,`phone`,`email`,`union_id`,`status`,`created_at`,`updated_at`) values (7,'admin','123456','111','111','1111111111','11111129@sohu.com','111111','ACTIVE','2026-06-10 14:40:49','2026-07-06 09:53:05'),(8,'banzhuren01','123456','班主任1','班主任1','13762922584','913038933@qq.com',NULL,'ACTIVE','2026-06-11 15:22:26','2026-06-11 15:22:26'),(9,'laoshi1','123456','老师1','老师1','13273576020','913038933@qq.com',NULL,'ACTIVE','2026-06-12 11:21:23','2026-06-12 11:21:23'),(10,'laoshi2','123456','老师2','老师2',NULL,NULL,NULL,'ACTIVE','2026-06-12 11:34:41','2026-06-12 11:34:41'),(13,'ceshi','ceshi','ceshi',NULL,'15263455888',NULL,NULL,'ACTIVE','2026-06-15 22:41:19','2026-06-15 22:41:19'),(15,'daoshi1','$2a$10$wifskTjQOCSRmc763XClxOllQOvWfw5k7f0WkX5JeWjiTfOpHpydW','导师1','导师1',NULL,NULL,NULL,'ACTIVE','2026-06-16 23:35:08','2026-07-04 17:47:33'),(16,'keke','123456','keke','keke','13165657288','1@qq.com',NULL,'ACTIVE','2026-06-17 10:06:58','2026-06-17 10:06:58'),(17,'zqy','123456','zqy','zqy','15616718730','xxxx@163.com',NULL,'ACTIVE','2026-06-17 16:24:16','2026-06-17 16:24:16'),(27,'xiaoxiao','123456','小薇','班主任2','11111111','1223231123@qq.com',NULL,'ACTIVE','2026-06-18 14:30:33','2026-07-05 22:52:09'),(28,'guangtouqiang','123456','光头强','光头强','1213213131','1231676723@qq.com',NULL,'ACTIVE','2026-06-18 14:33:17','2026-07-05 22:53:01'),(32,'zhs','$2a$10$440LxLiubH.V8Giqpk6r5OD2ZMP4BOIUhK1laJO/CRfdpJAPbbUEm','局勇','钮斌','13411111111','oq3kgn43@sohu.com','3','ACTIVE','2012-04-19 08:00:00','2023-03-24 08:00:00'),(34,'lis','$2a$10$AbhUclUP5xd05ac8by8Tieo7rav9brJo8mskeP56YjpsPHKUVQKK.','局勇','钮斌','13411111112','oq3kgn4ss3@sohu.com','4','ACTIVE','2026-07-03 14:46:47','2026-07-03 14:46:47'),(36,'schedule_test_teacher','123456','排课测试老师','排课测试老师','13900000036','schedule.teacher@test.local',NULL,'ACTIVE','2026-07-21 15:57:09','2026-07-21 15:57:09'),(37,'小新','123456','小新老师','小新','18811309898','xiaoxin@163.com','30','ACTIVE','2026-07-21 17:17:09','2026-07-21 17:17:09');

/*Table structure for table `sys_user_role` */

DROP TABLE IF EXISTS `sys_user_role`;

CREATE TABLE `sys_user_role` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户角色关联表';

/*Data for the table `sys_user_role` */

insert  into `sys_user_role`(`id`,`user_id`,`role_id`,`created_at`) values (6,7,4,'2026-06-10 17:17:29'),(7,8,5,'2026-06-11 15:22:35'),(8,9,6,'2026-06-12 11:21:35'),(9,10,6,'2026-06-12 11:34:47'),(13,15,7,'2026-06-16 23:36:03'),(14,16,4,'2026-06-17 10:07:10'),(15,17,4,'2026-06-17 16:24:29'),(31,27,5,'2026-07-20 11:39:50'),(32,27,4,'2026-07-20 11:39:50'),(33,28,6,'2026-07-20 11:42:08'),(34,28,7,'2026-07-20 11:42:08'),(35,36,6,'2026-07-21 15:57:09'),(36,37,6,'2026-07-21 17:17:52');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
