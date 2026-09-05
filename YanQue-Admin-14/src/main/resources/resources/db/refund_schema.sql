CREATE TABLE IF NOT EXISTS `order_refund` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '退款订单ID',
  `refund_order_no` varchar(64) NOT NULL COMMENT '退款订单号',
  `payment_order_no` varchar(64) NOT NULL COMMENT '原支付订单号',
  `payment_amount` decimal(10,2) NOT NULL COMMENT '原支付金额',
  `refund_amount` decimal(10,2) DEFAULT NULL COMMENT '退款金额',
  `status` varchar(30) NOT NULL COMMENT '退款状态',
  `reason` varchar(200) DEFAULT NULL COMMENT '退款原因',
  `unique_refund_no` varchar(128) DEFAULT NULL COMMENT '支付宝交易号',
  `fail_reason` varchar(500) DEFAULT NULL COMMENT '失败原因',
  `refund_success_time` datetime DEFAULT NULL COMMENT '退款成功时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uk_refund_order_no` (`refund_order_no`),
  KEY `idx_payment_order_no` (`payment_order_no`), KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款订单表';
