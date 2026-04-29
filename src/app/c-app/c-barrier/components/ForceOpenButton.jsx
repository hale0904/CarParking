import React from 'react';
import { Button, Popconfirm, notification } from 'antd';
import { UnlockOutlined } from '@ant-design/icons';

const ForceOpenButton = ({ barrierId, status, networkMode, mechanicalJam, onConfirm }) => {
  const disabled =
    status === 'open' || status === 'manual_override' || status === 'failsafe_open' || mechanicalJam;

  const handleConfirm = () => {
    onConfirm(barrierId);
    const timestamp = new Date().toISOString();
    console.log(`[ACTION LOG] Admin triggered Force Open on barrier ${barrierId} at ${timestamp}`);

    notification.success({
      message: networkMode === 'offline' ? 'Offline Override Activated' : 'Command Sent',
      description:
        networkMode === 'offline'
          ? `Manual offline override was simulated for ${barrierId}.`
          : `Force open command successfully dispatched to ${barrierId}.`,
    });
  };

  return (
    <Popconfirm
      title="Force Open Barrier"
      description="Are you sure you want to manually open this barrier and override the automatic flow?"
      onConfirm={handleConfirm}
      okText="Yes, Force Open"
      cancelText="Cancel"
      disabled={disabled}
      okButtonProps={{ danger: true }}
    >
      <Button
        type="primary"
        danger
        icon={<UnlockOutlined />}
        disabled={disabled}
        size="large"
        style={{ width: '100%', fontWeight: 'bold' }}
      >
        Force Open
      </Button>
    </Popconfirm>
  );
};

export default ForceOpenButton;
