# 订单业务规则

订单查询属于 order 业务域。订单金额使用 `order_payment.order_amount`，支付成功时间使用 `order_payment.pay_success_time`。
订单数量应明确时间范围；金额单位为数据库存储单位。没有明确口径时先向用户澄清。
