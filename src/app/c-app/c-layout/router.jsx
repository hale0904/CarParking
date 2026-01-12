import PrivateLayout from '~/routers/privateRoute';

import { LayoutDefault } from '.';
import { dashboardRoutes } from '../c-dashboard';

export const layoutRoutes = [
  {
    element: <PrivateLayout />, // check login
    children: [
      {
        path: '/',
        element: <LayoutDefault />, // layout
        children: [
          ...dashboardRoutes,
        ],
      },
    ],
  },
];
