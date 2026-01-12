import './Login001-admin.page.scss';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import slider1 from '~/assets/slider1.jpg';
import slider2 from '~/assets/slider2.jpg';
import slider3 from '~/assets/slider3.png';
import logo from '~/assets/smart_parking_logo.png';
import { Button, Form, Carousel } from '../../../../c-lib/index';
import { login } from '../../shared/service/login.service';
import { Account } from '../../shared/dtos/Account.dto';

function Login001() {
  const [account, setAccount] = useState({ ...login });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setAccount({
      ...account,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async () => {
    try {
      const res = await login(account);
      console.log(res);

      localStorage.setItem('token', res.token);
      alert('Đăng nhập thành công');
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <Carousel
          fade
          interval={3000} // 3s tự chuyển
          pause={false} // hover không dừng
          controls={false} // ẩn nút
          indicators={true}
        >
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

      <div className="login-right">
        <div className="login-title">
          <img className="d-block logo" src={logo} alt="slide 1" />
          <h1>ĐĂNG NHẬP</h1>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Tên đăng nhập</Form.Label>
          <Form.Control name="userName" value={account.userName} onChange={handleChange} />
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
