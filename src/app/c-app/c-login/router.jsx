import DashBoard from '../c-dashboard/pages/dashBoard/DashBoard';
import LayoutAdmin from '../c-layout/layout-default/LayoutAdmin';
import Login001 from './pages/login-admin/Login';
import { Navigate } from 'react-router-dom';

export const authRoutes = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login001 />,
  },
];
console.log('a', authRoutes);
