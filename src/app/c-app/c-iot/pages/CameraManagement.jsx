import React from 'react';
import DeviceManagementContent from '../shared/DeviceManagementContent';
import { CAMERA_API } from '../../../c-lib/api/iot.api';
import { useAdminI18n } from '../../../c-lib/i18n/adminI18n';

const CameraManagement = () => {
  const { t } = useAdminI18n();

  return (
    <DeviceManagementContent
      categoryCode="CA002"
      fallbackPath="/admin/iot-sensors"
      apiConfig={CAMERA_API}
      pageConfig={{
        title: t('iot.cameraTitle'),
        description: t('iot.cameraDescription'),
        entityName: t('layout.cameras'),
        showLinkedSlot: false,
        showUnlinkedStat: false,
        buildCreatePayload: () => ({
          code: '0',
          categoryCode: 'CA002',
        }),
        buildUpdatePayload: (device, values) => ({
          _id: device._id,
          code: device.code,
          categoryCode: 'CA002',
          isOnline: values.status === 'Online',
        }),
      }}
    />
  );
};

export default CameraManagement;
