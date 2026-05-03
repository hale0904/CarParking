import React from 'react';
import DeviceManagementContent from '../shared/DeviceManagementContent';
import { SENSOR_API } from '../../../c-lib/api/iot.api';
import { useAdminI18n } from '../../../c-lib/i18n/adminI18n';

const SensorManagement = () => {
  const { t } = useAdminI18n();

  return (
    <DeviceManagementContent
      categoryCode="CA001"
      fallbackPath="/admin/iot-cameras"
      apiConfig={SENSOR_API}
      pageConfig={{
        title: t('iot.sensorTitle'),
        description: t('iot.sensorDescription'),
        entityName: t('layout.sensors'),
        showLinkedSlot: true,
        showUnlinkedStat: true,
      }}
    />
  );
};

export default SensorManagement;
