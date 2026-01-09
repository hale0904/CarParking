import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1 style={{ fontSize: '72px', marginBottom: '16px' }}>404</h1>
      <p style={{ fontSize: '18px', marginBottom: '24px' }}>
        Trang bạn tìm không tồn tại
      </p>

      <Link to="/login">
        <button style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Quay về đăng nhập
        </button>
      </Link>
    </div>
  );
}

export default NotFound;
