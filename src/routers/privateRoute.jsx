import { Navigate, Outlet } from 'react-router-dom';

const PrivateLayout = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateLayout;
