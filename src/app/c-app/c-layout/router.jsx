import { mapRoutes } from '../c-map/router';
import LayoutDefault from './layout-default/LayoutAdmin';

export const layoutRoutes = [
  {
    path: '/admin',
    element: <LayoutDefault />,
    children: [
      ...mapRoutes,
    ],
  },
];
