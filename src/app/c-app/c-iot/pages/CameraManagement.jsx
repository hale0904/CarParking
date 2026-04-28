import React from 'react';
import DeviceManagementContent from '../shared/DeviceManagementContent';
import { CAMERA_API } from '../../../c-lib/constants/auth-api.constant';

const CameraManagement = () => (
  <DeviceManagementContent
    categoryCode="CA002"
    fallbackPath="/admin/iot-sensors"
    apiConfig={CAMERA_API}
    pageConfig={{
      title: 'Camera Management',
      description: 'Manage camera records using the shared IoT API.',
      entityName: 'Camera',
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
        isActive: 1,
      }),
    }}
  />
);

export default CameraManagement;
