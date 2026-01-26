import { Navigate, Outlet } from 'react-router-dom';
import AuthHelper from '../app/c-lib/auth/auth.helper';

const PrivateLayout = () => {
  if (!AuthHelper.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateLayout;
