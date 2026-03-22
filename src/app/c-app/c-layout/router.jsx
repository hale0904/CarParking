import { mapRoutes } from '../c-map/router';
import { statisticsRoutes } from '../c-statics/router';
import LayoutDefault from './layout-default/LayoutAdmin';
import { dashboardRoutes } from '../c-dashboard/router';
import { deviceRoutes } from '../c-iot/router';

export const layoutRoutes = [
  {
    path: '/admin',
    element: <LayoutDefault />,
    children: [...mapRoutes, ...statisticsRoutes, ...dashboardRoutes, ...deviceRoutes],
  },
];
