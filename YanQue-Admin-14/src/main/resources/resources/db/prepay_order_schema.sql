CREATE TABLE IF NOT EXISTS `prepay_order` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预支付订单表';
