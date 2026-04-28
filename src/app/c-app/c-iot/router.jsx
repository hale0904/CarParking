// d:\Dev\DoAn\CarParking\src\app\c-app\c-iot\router.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import SensorManagement from './pages/SensorManagement';
import CameraManagement from './pages/CameraManagement';
import { IotCategoryNavContext } from '../c-layout/layout-default/LayoutAdmin';

const DeviceRouteRedirect = () => {
  const { categories } = useContext(IotCategoryNavContext);

  if (categories.some((category) => category.code === 'CA001')) {
    return <Navigate to="/admin/iot-sensors" replace />;
  }

  if (categories.some((category) => category.code === 'CA002')) {
    return <Navigate to="/admin/iot-cameras" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
};

export const deviceRoutes = [
  {
    path: 'devices',
    element: <DeviceRouteRedirect />,
  },
  {
    path: 'iot-sensors',
    element: <SensorManagement />,
  },
  {
    path: 'iot-cameras',
    element: <CameraManagement />,
  },
];
