import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/register`, {
        name: values.name,
        email: values.email,
        password: values.password
      });
      
      if (response.data.status === 'success') {
        message.success(response.data.message || 'Registration successful!');
        navigate('/login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Registration failed';
      setErrorMsg(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Card
        hoverable
        style={{
          width: '90%',
          maxWidth: 400,
          borderRadius: 15,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: 'none',
        }}
        bodyStyle={{ padding: '40px 25px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={3} style={{ color: '#2c3e50', marginBottom: 5 }}>
            Create Account
          </Title>
          <p style={{ color: '#7f8c8d', margin: 0 }}>Join our community</p>
        </div>

        {errorMsg && (
          <div style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
            {errorMsg}
          </div>
        )}

        <Form
          name="register-form"
          onFinish={handleRegister}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#7f8c8d' }} />} 
              placeholder="Full Name" 
              size="large" 
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#7f8c8d' }} />} 
              placeholder="Email" 
              size="large" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 8, message: 'Password must be at least 8 characters!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#7f8c8d' }} />} 
              placeholder="Password" 
              size="large" 
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Passwords do not match!');
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#7f8c8d' }} />} 
              placeholder="Confirm Password" 
              size="large" 
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                marginTop: 15,
              }}
            >
              Register
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 20, color: '#7f8c8d' }}>
          <span>Already have an account? </span>
          <Button
            type="link"
            onClick={() => navigate('/login')}
            style={{
              color: '#764ba2',
              fontWeight: 600,
              padding: 0,
              height: 'auto'
            }}
          >
            Login here
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Register;