import './login.scss';
import { useNavigate } from 'react-router-dom';
import slider1 from '~/assets/slider1.jpg';
import slider2 from '~/assets/slider2.jpg';
import slider3 from '~/assets/slider3.png';
import logo from '~/assets/smart_parking_logo.png';
import { Carousel, Typography, Form, Input, Button, notification, ConfigProvider } from 'antd';
import { UserOutlined, LockOutlined, RightOutlined } from '@ant-design/icons';
import LoginService from '../../shared/service/login.service';
import { useState } from 'react';
import AuthHelper from '../../../../c-lib/auth/auth.helper';

const { Title, Text } = Typography;

function Login001() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const res = await LoginService(values);

      AuthHelper.setTokens(res);

      notification.success({
        message: 'Welcome Back!',
        description: 'Successfully logged into Smart Parking system.',
        placement: 'topRight',
      });
      navigate('/admin/dashboard');
    } catch (err) {
      notification.error({
        message: 'Login Failed',
        description: err?.response?.data?.message || 'Please check your credentials and try again.',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4F46E5',
          borderRadius: 12,
          controlHeight: 48,
        },
        components: {
          Input: {
            activeBorderColor: '#4F46E5',
            hoverBorderColor: '#4F46E5',
          },
        },
      }}
    >
      <div className="modern-login-container">
        {/* Background Gradient Animation */}
        <div className="bg-gradient-mesh"></div>

        <div className="login-content-wrapper">
          <div className="login-glass-card">
            {/* LEFT: Branding/Hero */}
            <div className="login-hero-section">
              <div className="hero-overlay">
                <div className="hero-content">
                  <Title level={2} className="hero-title">Smart Parking</Title>
                  <Text className="hero-subtitle">Modernizing Urban Mobility & Gate Management System.</Text>
                </div>
              </div>
              <Carousel autoplay effect="fade" pauseOnHover={false} dots={false} className="hero-carousel" autoplaySpeed={4000}>
                <div><div className="slide-image" style={{ backgroundImage: `url(${slider1})` }} /></div>
                <div><div className="slide-image" style={{ backgroundImage: `url(${slider2})` }} /></div>
                <div><div className="slide-image" style={{ backgroundImage: `url(${slider3})` }} /></div>
              </Carousel>
            </div>

            {/* RIGHT: Login Form */}
            <div className="login-form-section">
              <div className="form-inner">
                <div className="form-header">
                  <img src={logo} alt="Smart Parking Logo" className="brand-logo" />
                  <Title level={3} className="form-title">Login</Title>
                  <Text type="secondary" className="form-desc">Please log in to access the Admin Dashboard.</Text>
                </div>

                <Form
                  name="login_form"
                  layout="vertical"
                  size="large"
                  onFinish={handleFinish}
                  requiredMark={false}
                >
                  <Form.Item
                    name="email"
                    label="Username"
                    rules={[{ required: true, message: 'Please enter your username!' }]}
                  >
                    <Input
                      variant="filled"
                      prefix={<UserOutlined className="input-icon" />}
                      placeholder="admin@smartparking.com"
                      className="enhanced-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true, message: 'Please enter your password!' }]}
                  >
                    <Input.Password
                      variant="filled"
                      prefix={<LockOutlined className="input-icon" />}
                      placeholder="••••••••"
                      className="enhanced-input"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="login-submit-btn"
                      loading={loading}
                      block
                    >
                      Continue <RightOutlined className="submit-icon" />
                    </Button>
                  </Form.Item>
                </Form>

                <div className="form-footer">
                  <Text type="secondary">Forgot password? Please contact IT Support.</Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default Login001;
