import React from 'react';
import DeviceManagementContent from '../shared/DeviceManagementContent';
import { SENSOR_API } from '../../../c-lib/api/iot.api';

const SensorManagement = () => (
  <DeviceManagementContent
    categoryCode="CA001"
    fallbackPath="/admin/iot-cameras"
    apiConfig={SENSOR_API}
    pageConfig={{
      title: 'Sensor Management',
      description: 'Manage sensor records and their linked parking slots using the shared IoT API.',
      entityName: 'Sensor',
      showLinkedSlot: true,
      showUnlinkedStat: true,
    }}
  />
);

export default SensorManagement;
