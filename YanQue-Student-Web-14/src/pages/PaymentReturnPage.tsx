import { Button, Descriptions, Form, Input, InputNumber, Result, Select, Space, Spin, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentApi } from '../api/student';
import type { PaymentReturnInfo } from '../types/student';

interface ProfileValues {
  password: string;
  confirmPassword: string;
  education: string;
  gradeYear: number;
  school: string;
  major?: string;
}

const educationOptions = [
  { label: '高中', value: '高中' },
  { label: '大专', value: '大专' },
  { label: '本科', value: '本科' },
  { label: '硕士', value: '硕士' },
  { label: '博士', value: '博士' },
  { label: '其他', value: '其他' },
];

const formatMoney = (value?: number) => `¥${Number(value || 0).toFixed(2)}`;

export default function PaymentReturnPage() {
  const [form] = Form.useForm<ProfileValues>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [info, setInfo] = useState<PaymentReturnInfo>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const orderNo = searchParams.get('orderNo') || localStorage.getItem('yanque_student_payment_order_no') || '';

  useEffect(() => {
    if (!orderNo) {
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await studentApi.paymentReturnInfo(orderNo);
        setInfo(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [orderNo]);

  const submit = async () => {
    const values = await form.validateFields();
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setSubmitting(true);
    try {
      const result = await studentApi.completeProfile({ orderNo, ...values });
      if (result.token) {
        localStorage.setItem('yanque_student_token', result.token);
      }
      if (result.signSecret) {
        localStorage.setItem('yanque_student_sign_secret', result.signSecret);
      }
      if (result.student) {
        localStorage.setItem('yanque_student_info', JSON.stringify(result.student));
      }
      localStorage.removeItem('yanque_student_pending_order');
      localStorage.removeItem('yanque_student_payment_order_no');
      localStorage.removeItem('yanque_pending_pay_token');
      localStorage.removeItem('yanque_pending_pay_sign_secret');
      message.success('注册完成');
      navigate('/', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderNo) {
    return (
      <main className="return-page">
        <Result
          status="warning"
          title="未找到支付订单"
          subTitle="请重新登录后查看待支付订单。"
          extra={
            <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
              返回登录
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="return-page">
      <section className="return-shell">
        <div className="return-hero">
          <div>
            <Typography.Text className="success-kicker">支付成功</Typography.Text>
            <Typography.Title level={2}>完善学生信息</Typography.Title>
            <Typography.Text type="secondary">请设置登录密码并补充学习资料，完成后即可进入学生页面。</Typography.Text>
          </div>
          <Button onClick={() => navigate('/login', { replace: true })}>返回登录</Button>
        </div>

        <div className="return-layout">
          <section className="return-summary">
            <Typography.Title level={4}>支付信息</Typography.Title>
            <Spin spinning={loading}>
              <Descriptions column={1} bordered size="middle">
                <Descriptions.Item label="支付订单号">{info?.orderNo || orderNo}</Descriptions.Item>
                <Descriptions.Item label="学生姓名">{info?.studentName || '-'}</Descriptions.Item>
                <Descriptions.Item label="手机号">{info?.studentPhone || '-'}</Descriptions.Item>
                <Descriptions.Item label="产品内容">{info?.productContent || (info ? `产品ID ${info.productId}` : '-')}</Descriptions.Item>
                <Descriptions.Item label="支付金额">{formatMoney(info?.orderAmount)}</Descriptions.Item>
              </Descriptions>
            </Spin>
          </section>

          <section className="profile-panel">
            <Typography.Title level={4}>学生资料</Typography.Title>
            <Form form={form} layout="vertical" initialValues={{ education: '本科', gradeYear: new Date().getFullYear() }}>
              <Form.Item name="password" label="登录密码" rules={[{ required: true, message: '请输入登录密码' }]}>
                <Input.Password placeholder="用于后续登录学生端" />
              </Form.Item>
              <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true, message: '请再次输入登录密码' }]}>
                <Input.Password placeholder="请再次输入登录密码" />
              </Form.Item>
              <div className="profile-grid">
                <Form.Item name="education" label="学历" rules={[{ required: true, message: '请选择学历' }]}>
                  <Select options={educationOptions} />
                </Form.Item>
                <Form.Item name="gradeYear" label="哪一届" rules={[{ required: true, message: '请输入届数' }]}>
                  <InputNumber min={2000} max={2100} precision={0} style={{ width: '100%' }} addonAfter="届" />
                </Form.Item>
              </div>
              <Form.Item name="school" label="学校" rules={[{ required: true, message: '请输入学校' }]}>
                <Input placeholder="请输入学校名称" />
              </Form.Item>
              <Form.Item name="major" label="专业">
                <Input placeholder="请输入专业，可选" />
              </Form.Item>
              <Space className="return-actions">
                <Button type="primary" loading={submitting} onClick={submit}>
                  完成注册
                </Button>
              </Space>
            </Form>
          </section>
        </div>
      </section>
    </main>
  );
}
