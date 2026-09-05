import { Button, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/system';
import type { LoginValues } from '../types/system';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (values: LoginValues) => {
    setLoading(true);
    try {
      const data = await authApi.login(values);
      localStorage.setItem('yanque_token', data.token);
      localStorage.setItem('yanque_sign_secret', data.signSecret);
      localStorage.setItem('yanque_user', JSON.stringify(data.userDetailRes || {}));
      localStorage.setItem('yanque_roles', JSON.stringify(data.roleDetailResList || []));
      localStorage.setItem('yanque_permissions', JSON.stringify(data.permissionDetailResList || []));
      message.success('登录成功');
      navigate('/users', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-brand">
          <div className="brand-mark">YQ</div>
          <Typography.Title level={1}>YanQue Admin</Typography.Title>
          <Typography.Text>后台管理系统</Typography.Text>
          <div className="brand-status">
            <span>ACTIVE</span>
            <span>INACTIVE</span>
          </div>
        </section>
        <section className="login-card">
          <Typography.Title level={3}>登录</Typography.Title>
          <Typography.Text type="secondary">请输入账号信息</Typography.Text>
        <Form<LoginValues> layout="vertical" className="login-form" onFinish={submit}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input size="large" autoComplete="username" placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size="large" autoComplete="current-password" placeholder="请输入密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={loading} block>
            登录
          </Button>
        </Form>
        </section>
      </div>
    </div>
  );
}
