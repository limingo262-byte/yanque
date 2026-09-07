# 订单指标口径

- 订单支付金额：`SUM(order_payment.order_amount)`，时间字段为 `pay_success_time`。
- 支付记录数：`COUNT(order_payment.id)`，需要先确认是否按订单去重。
- 没有时间范围的趋势或统计问题，必须先澄清时间范围。
