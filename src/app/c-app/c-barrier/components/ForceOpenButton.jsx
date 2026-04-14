import React from 'react';
import { Button, Popconfirm, notification } from 'antd';
import { UnlockOutlined } from '@ant-design/icons';

const ForceOpenButton = ({ barrierId, status, onConfirm }) => {
  const disabled = status === 'open' || status === 'offline';

  const handleConfirm = () => {
    // Call the parent handler
    onConfirm(barrierId);
    
    // Log the action to the console (simulated)
    const timestamp = new Date().toISOString();
    console.log(`[ACTION LOG] Admin triggered Force Open on barrier ${barrierId} at ${timestamp}`);
    
    notification.success({
      message: 'Command Sent',
      description: `Force open command successfully dispatched to ${barrierId}.`,
    });
  };

  return (
    <Popconfirm
      title="Force Open Barrier"
      description="Are you sure you want to manually open this barrier?"
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
