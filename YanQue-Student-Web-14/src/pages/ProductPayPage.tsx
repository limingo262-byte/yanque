import { Button, Descriptions, Result, Space, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../api/student';
import type { StudentInfo, StudentPendingPayOrder } from '../types/student';

export default function ProductPayPage() {
  const navigate = useNavigate();
  const [orderNo, setOrderNo] = useState('');
  const [orderNoLoading, setOrderNoLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const pendingOrder = useMemo(() => {
    const raw = localStorage.getItem('yanque_student_pending_order');
    return raw ? (JSON.parse(raw) as StudentPendingPayOrder) : undefined;
  }, []);
  const student = useMemo(() => {
    const raw = localStorage.getItem('yanque_student_info');
    return raw ? (JSON.parse(raw) as StudentInfo) : undefined;
  }, []);

  const formatMoney = (value?: number) => `¥${Number(value || 0).toFixed(2)}`;

  useEffect(() => {
    if (!pendingOrder) {
      return;
    }
    const createOrderNo = async () => {
      setOrderNoLoading(true);
      try {
        const data = await studentApi.createOrderNo();
        setOrderNo(data.orderNo);
      } finally {
        setOrderNoLoading(false);
      }
    };
    void createOrderNo();
  }, [pendingOrder]);

  if (!pendingOrder) {
    return (
      <main className="pay-page">
        <Result
          status="warning"
          title="暂无待支付订单"
          subTitle="请先使用报名手机号登录，系统会自动匹配待支付订单。"
          extra={
            <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
              返回登录
            </Button>
          }
        />
      </main>
    );
  }

  const pay = async () => {
    if (!orderNo) {
      message.warning('订单号生成中，请稍后再试');
      return;
    }
    setPayLoading(true);
    try {
      const data = await studentApi.createPaymentOrder({
        orderNo,
        studentPhone: pendingOrder.studentPhone,
        studentName: pendingOrder.studentName,
        productId: String(pendingOrder.productId),
        orderAmount: Number(pendingOrder.payableAmount || 0),
        prepayOrderNo: pendingOrder.orderNo,
      });
      if (!data.cashierUrl) {
        message.error('未获取到收银台地址');
        return;
      }
      localStorage.setItem('yanque_student_payment_order_no', orderNo);
      window.location.href = data.cashierUrl;
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <main className="pay-page">
      <section className="pay-shell">
        <div className="pay-header">
          <div>
            <Typography.Title level={2}>产品支付</Typography.Title>
            <Typography.Text type="secondary">{student?.name || pendingOrder.studentName}，请确认订单后完成支付</Typography.Text>
          </div>
          <Button onClick={() => navigate('/login', { replace: true })}>返回登录</Button>
        </div>

        <div className="pay-content">
          <div className="pay-summary">
            <Typography.Text type="secondary">应付金额</Typography.Text>
            <div className="pay-amount">{formatMoney(pendingOrder.payableAmount)}</div>
            <Typography.Text type="secondary">
              产品金额 {formatMoney(pendingOrder.productAmount)}，已优惠 {formatMoney(pendingOrder.discountAmount)}
            </Typography.Text>
          </div>

          <Descriptions column={1} bordered className="pay-detail">
            <Descriptions.Item label="订单号">{orderNoLoading ? '生成中...' : orderNo}</Descriptions.Item>
            <Descriptions.Item label="预支付订单号">{pendingOrder.orderNo}</Descriptions.Item>
            <Descriptions.Item label="学生姓名">{pendingOrder.studentName}</Descriptions.Item>
            <Descriptions.Item label="手机号">{pendingOrder.studentPhone}</Descriptions.Item>
            <Descriptions.Item label="产品内容">{pendingOrder.productContent || `产品ID ${pendingOrder.productId}`}</Descriptions.Item>
            <Descriptions.Item label="产品金额">{formatMoney(pendingOrder.productAmount)}</Descriptions.Item>
            <Descriptions.Item label="优惠金额">{formatMoney(pendingOrder.discountAmount)}</Descriptions.Item>
            <Descriptions.Item label="订单状态">待支付</Descriptions.Item>
          </Descriptions>

          <Space className="pay-actions">
            <Button size="large" onClick={() => navigate('/login', { replace: true })}>
              暂不支付
            </Button>
            <Button type="primary" size="large" loading={payLoading} disabled={orderNoLoading || !orderNo} onClick={pay}>
              立即支付
            </Button>
          </Space>
        </div>
      </section>
    </main>
  );
}
