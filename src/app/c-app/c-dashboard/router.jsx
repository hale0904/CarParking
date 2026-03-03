import PrivateLayout from '../../../routers/privateRoute';
import DashboardPage from './pages/dashBoard/DashboardPage';

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: <PrivateLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
    ],
  },
];

console.log('ff', dashboardRoutes);