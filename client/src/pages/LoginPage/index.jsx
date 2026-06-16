import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { login } from '../../features/auth/auth.js';

export function LoginPage() {
  const navigate = useNavigate();

  async function onFinish(values) {
    try {
      await login(values);
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || 'Ошибка авторизации');
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <Typography.Title level={3}>Вход в систему</Typography.Title>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ login: 'admin', password: '123456' }}>
          <Form.Item name="login" label="Логин" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true }]}><Input.Password /></Form.Item>
          <Button type="primary" htmlType="submit" block>Войти</Button>
        </Form>
      </Card>
    </div>
  );
}
