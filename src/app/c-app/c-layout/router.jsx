import { mapRoutes } from '../c-map/router';
import { statisticsRoutes } from '../c-statics/router';
import LayoutDefault from './layout-default/LayoutAdmin';
import { dashboardRoutes } from '../c-dashboard/router';
import { deviceRoutes } from '../c-iot/router';
import { barrierRoutes } from '../c-barrier/router';
import PrivateLayout from '../../../routers/privateRoute';

export const layoutRoutes = [
  {
    element: <PrivateLayout />,
    children: [
      {
        path: '/admin',
        element: <LayoutDefault />,
        children: [...mapRoutes, ...statisticsRoutes, ...dashboardRoutes, ...deviceRoutes, ...barrierRoutes],
      }
    ]
  },
];
