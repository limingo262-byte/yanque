import { Button, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../api/student';
import type { StudentLoginValues } from '../types/student';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (values: StudentLoginValues) => {
    setLoading(true);
    try {
      const result = await studentApi.login(values);
      if (result.needPay) {
        if (result.pendingPayToken) {
          localStorage.setItem('yanque_pending_pay_token', result.pendingPayToken);
        }
        if (result.pendingPaySignSecret) {
          localStorage.setItem('yanque_pending_pay_sign_secret', result.pendingPaySignSecret);
        }
        if (result.pendingOrder) {
          localStorage.setItem('yanque_student_pending_order', JSON.stringify(result.pendingOrder));
        }
        if (result.student) {
          localStorage.setItem('yanque_student_info', JSON.stringify(result.student));
        }
        navigate('/pay', { replace: true });
        return;
      }
      if (result.needCompleteProfile && result.paymentOrderNo) {
        localStorage.setItem('yanque_student_payment_order_no', result.paymentOrderNo);
        if (result.pendingPayToken) {
          localStorage.setItem('yanque_pending_pay_token', result.pendingPayToken);
        }
        if (result.pendingPaySignSecret) {
          localStorage.setItem('yanque_pending_pay_sign_secret', result.pendingPaySignSecret);
        }
        if (result.student) {
          localStorage.setItem('yanque_student_info', JSON.stringify(result.student));
        }
        navigate(`/payment-return?orderNo=${encodeURIComponent(result.paymentOrderNo)}`, { replace: true });
        return;
      }
      if (!result.token) {
        message.error('登录失败，请稍后重试');
        return;
      }
      localStorage.setItem('yanque_student_token', result.token);
      if (result.signSecret) {
        localStorage.setItem('yanque_student_sign_secret', result.signSecret);
      }
      if (result.student) {
        localStorage.setItem('yanque_student_info', JSON.stringify(result.student));
      }
      message.success('登录成功');
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-visual" aria-hidden="true">
        <div className="brand-lockup">
          <span className="brand-mark">YQ</span>
          <span>YanQue Student</span>
        </div>
        <div className="visual-copy">
          <Typography.Title level={1}>学生中心</Typography.Title>
          <Typography.Paragraph>查看课程、确认订单、完成支付。</Typography.Paragraph>
        </div>
      </section>

      <section className="login-form-wrap">
        <div className="login-form-panel">
          <Typography.Title level={2}>学生登录</Typography.Title>
          <Typography.Text type="secondary">使用报名手机号登录学生中心</Typography.Text>

          <Form<StudentLoginValues> layout="vertical" className="login-form" onFinish={submit} requiredMark={false}>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1\d{10}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input size="large" placeholder="请输入手机号" autoComplete="tel" />
            </Form.Item>

            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" placeholder="请输入密码" autoComplete="current-password" />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              登录
            </Button>
          </Form>
        </div>
      </section>
    </main>
  );
}
