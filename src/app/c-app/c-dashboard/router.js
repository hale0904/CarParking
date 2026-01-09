import PrivateLayout from '../../../routers/privateRoute';
import Dashboard001 from './pages/dashboard001-car-list/dashboard001.component';

export const dashboardRoutes = [
  {
    path: '/dashboard',
    element: <PrivateLayout />,
    children: [
      { index: true, element: <Dashboard001 /> },
    ],
  },
];
