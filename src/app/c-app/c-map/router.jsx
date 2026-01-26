import CarParkingManagement from './pages/CarParkingManagement';
import CarParkingList from './pages/CarParkingList';

export const mapRoutes = [
    {
        path: 'carparking-list',
        element: <CarParkingList />,
    },
    {
        path: 'carparking-management',
        element: <CarParkingManagement />,
    },
];
