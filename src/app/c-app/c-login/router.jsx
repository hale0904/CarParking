import LayoutAdmin from '../c-layout/layout-default/LayoutAdmin';
import Login001 from './pages/login001-admin/login001-admin.page';
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
