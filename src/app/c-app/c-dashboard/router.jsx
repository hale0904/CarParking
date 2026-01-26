import PrivateLayout from '../../../routers/privateRoute';
import DashBoard from './pages/dashBoard/DashBoard';

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: <PrivateLayout />,
    children: [
      { index: true, element: <DashBoard /> },
    ],
  },
];

console.log('ff', dashboardRoutes);