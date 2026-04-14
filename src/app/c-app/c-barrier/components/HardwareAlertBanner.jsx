import React, { useState, useEffect } from 'react';
import { Alert, Space, Button } from 'antd';
import { WarningOutlined, ClockCircleOutlined, DisconnectOutlined } from '@ant-design/icons';

const getAlertProps = (type) => {
  switch (type) {
    case 'Mechanical Jam':
      return { icon: <WarningOutlined />, color: 'error' };
    case 'Payment Timeout':
      return { icon: <ClockCircleOutlined />, color: 'warning' };
    case 'Sensor Offline':
      return { icon: <DisconnectOutlined />, color: 'error' };
    default:
      return { icon: <WarningOutlined />, color: 'info' };
  }
};

const HardwareAlertBanner = ({ alerts: initialAlerts }) => {
  const [activeAlerts, setActiveAlerts] = useState(initialAlerts || []);

  useEffect(() => {
    // Auto-dismiss logic after 10 seconds if not interacted
    const timers = activeAlerts.map(alert => {
      return setTimeout(() => {
        setActiveAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 10000); // 10 seconds
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [activeAlerts]);

  const handleResolve = (id) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (!activeAlerts || activeAlerts.length === 0) {
    return null; // hide if no alerts
  }

  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
      {activeAlerts.map(alert => {
        const { icon, color } = getAlertProps(alert.type);
        const timeString = new Date(alert.timestamp).toLocaleTimeString();

        return (
          <Alert
            key={alert.id}
            message={`${alert.type} - ${timeString}`}
            description={alert.message}
            type={color}
            showIcon
            icon={icon}
            action={
              <Button size="small" type="primary" danger={color === 'error'} onClick={() => handleResolve(alert.id)}>
                Resolve
              </Button>
            }
            closable
            onClose={() => handleResolve(alert.id)}
          />
        );
      })}
    </Space>
  );
};

export default HardwareAlertBanner;
