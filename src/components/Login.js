import React, { useState } from "react";
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Typography, 
  Divider,
  Modal 
} from "antd";
import { 
  
  LockOutlined,
  MailOutlined 
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await axios.post(`${apiBaseUrl}/auth/login`, {
        email: values.email,
        password: values.password
      });

      if (response.data.token) {
        const token = response.data.token;
        
        localStorage.setItem("token", token);
        localStorage.setItem("email", response.data.email);
        localStorage.setItem("name", response.data.name);
        localStorage.setItem("userRole", response.data.role);

        message.success("Login successful!");
        onLogin();
        navigate("/dashboard");
      }
    } catch (error) {
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      setErrorMsg(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      message.error("Please enter your email address");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/forgot-password`, {
        email: email
      });

      if (response.data.status === "success") {
        message.success(response.data.message);
        setForgotPasswordModalVisible(false);
        setResetPasswordModalVisible(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send OTP. Please try again.";
      message.error(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/reset-password`, {
        email: email,
        otp: otp,
        newPassword: newPassword
      });

      if (response.data.status === "success") {
        message.success(response.data.message);
        setResetPasswordModalVisible(false);
        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to reset password. Please try again.";
      message.error(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Card hoverable style={cardStyle} bodyStyle={{ padding: "40px 25px" }}>
        <div style={headerStyle}>
          <Title level={3} style={titleStyle}>
            Welcome Back
          </Title>
          <p style={subtitleStyle}>Please login to continue</p>
        </div>

        {errorMsg && <div style={errorStyle}>{errorMsg}</div>}

        <Form name="login-form" initialValues={{ remember: true }} onFinish={handleLogin} autoComplete="off">
          <Form.Item name="email" rules={[{ required: true, message: "Please input your email!" }]}>
            <Input prefix={<MailOutlined style={iconStyle} />} placeholder="Email" size="large" style={inputStyle} />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: "Please input your password!" }]}>
            <Input.Password prefix={<LockOutlined style={iconStyle} />} placeholder="Password" size="large" style={inputStyle} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large" style={buttonStyle}>
              Log in
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Button type="link" onClick={() => setForgotPasswordModalVisible(true)} style={linkStyle}>
              Forgot Password?
            </Button>
          </div>

          <Divider style={{ margin: "16px 0" }} />

          <div style={footerStyle}>
            <Text>Don't have an account? </Text>
            <Button type="link" onClick={() => navigate("/register")} style={linkStyle}>
              Register now
            </Button>
          </div>
        </Form>
      </Card>

      {/* Forgot Password Modal */}
      <Modal
        title="Forgot Password"
        visible={forgotPasswordModalVisible}
        onCancel={() => setForgotPasswordModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setForgotPasswordModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={forgotPasswordLoading}
            onClick={handleForgotPassword}
          >
            Send OTP
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Email Address" required>
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title="Reset Password"
        visible={resetPasswordModalVisible}
        onCancel={() => setResetPasswordModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setResetPasswordModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={forgotPasswordLoading}
            onClick={handleResetPassword}
          >
            Reset Password
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="OTP Code" required>
            <Input
              placeholder="Enter OTP sent to your email"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="New Password" required>
            <Input.Password
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Confirm Password" required>
            <Input.Password
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Style constants
const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
};

const cardStyle = {
  width: "90%",
  maxWidth: 400,
  borderRadius: 15,
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  border: "none",
};

const headerStyle = {
  textAlign: "center",
  marginBottom: 30,
};

const titleStyle = {
  color: "#2c3e50",
  marginBottom: 5,
};

const subtitleStyle = {
  color: "#7f8c8d",
  margin: 0,
};

const errorStyle = {
  color: "red",
  textAlign: "center",
  marginBottom: 20,
};

const iconStyle = {
  color: "#7f8c8d",
};

const inputStyle = {
  borderRadius: 8,
};

const buttonStyle = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  marginTop: 15,
};

const footerStyle = {
  textAlign: "center",
  marginTop: 20,
  color: "#7f8c8d",
};

const linkStyle = {
  color: "#764ba2",
  fontWeight: 600,
  padding: 0,
  height: "auto",
};

export default Login;