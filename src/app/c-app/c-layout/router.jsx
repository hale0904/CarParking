import PrivateLayout from '~/routers/privateRoute';

import { LayoutDefault } from '.';
import { dashboardRoutes } from '../c-dashboard';
import CarParkingManagement from '../c-map/pages/CarParkingManagement';

export const layoutRoutes = [
  {
    path: '/admin',
    element: <LayoutDefault />, // check login
    children: [
      {
        path: 'carparking-management',
        element: <CarParkingManagement />,
      },
    ],
  },
];
