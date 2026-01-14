import './Login001-admin.page.scss';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import slider1 from '~/assets/slider1.jpg';
import slider2 from '~/assets/slider2.jpg';
import slider3 from '~/assets/slider3.png';
import logo from '~/assets/smart_parking_logo.png';
import { Button, Form, Carousel } from '../../../../c-lib/index';
import LoginService from '../../shared/service/login.service';

function Login001() {
  const navigate = useNavigate();

  // state
  const [account, setAccount] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAccount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    try {
      const res = await LoginService(account);

      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);

      alert('Đăng nhập thành công');
      navigate('/dashboard');
    } catch (err) {
      alert(err?.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="login-container">
      {/* LEFT */}
      <div className="login-left">
        <Carousel fade interval={3000} pause={false} controls={false} indicators>
          <Carousel.Item>
            <img className="d-block w-100" src={slider1} alt="slide 1" />
          </Carousel.Item>
          <Carousel.Item>
            <img className="d-block w-100" src={slider2} alt="slide 2" />
          </Carousel.Item>
          <Carousel.Item>
            <img className="d-block w-100" src={slider3} alt="slide 3" />
          </Carousel.Item>
        </Carousel>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-title">
          <img className="logo" src={logo} alt="Smart Parking" />
          <h1>ĐĂNG NHẬP</h1>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Tên đăng nhập</Form.Label>
          <Form.Control
            name="email"
            value={account.email}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Mật khẩu</Form.Label>
          <Form.Control
            name="password"
            type="password"
            value={account.password}
            onChange={handleChange}
          />
        </Form.Group>

        <Button variant="warning" className="LoginBtn" onClick={handleLogin}>
          Đăng nhập
        </Button>
      </div>
    </div>
  );
}

export default Login001;
