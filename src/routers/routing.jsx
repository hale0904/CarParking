import { createBrowserRouter } from 'react-router-dom';
import { authRoutes } from '../app/c-app/c-login/router';
import { NotFound } from '../app/c-app/c-layout/notFound';
import { layoutRoutes } from '../app/c-app/c-layout';

export const router = createBrowserRouter([
  ...authRoutes,
  ...layoutRoutes,
  {
    path: '*',
    element: <NotFound />,
  },
]);
console.log('authRoutes:', authRoutes);
console.log('ROUTING FILE RUN');

console.log('layout', layoutRoutes);
