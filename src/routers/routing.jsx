import { createBrowserRouter } from 'react-router-dom';
import { dashboardRoutes } from '../app/c-app/c-dashboard';
import { authRoutes } from '../app/c-app/c-login/router';
import { NotFound } from '../app/c-app/c-layout/notFound';

export const router = createBrowserRouter([
  ...authRoutes,
  // ...dashboardRoutes,
  {
    path: '*',
    element: <NotFound />,
  },
]);
console.log('authRoutes:', authRoutes);
console.log('ROUTING FILE RUN');
