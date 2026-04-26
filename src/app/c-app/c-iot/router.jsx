// d:\Dev\DoAn\CarParking\src\app\c-app\c-iot\router.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import DeviceManagement from './pages/DeviceManagement';
import IotCategoryManagement from './pages/IotCategoryManagement';

export const deviceRoutes = [
  {
    path: 'iot-categories',
    element: <IotCategoryManagement />,
  },
  {
    path: 'devices',
    element: <Navigate to="/admin/iot-categories" replace />,
  },
  {
    path: 'iot-devices/:categoryCode',
    element: <DeviceManagement />,
  },
];
