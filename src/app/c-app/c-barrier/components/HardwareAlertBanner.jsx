import React, { useEffect, useState } from 'react';
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
    case 'Fail-Safe Release':
      return { icon: <WarningOutlined />, color: 'warning' };
    case 'Offline Override':
      return { icon: <DisconnectOutlined />, color: 'warning' };
    case 'Reliability Monitor':
      return { icon: <ClockCircleOutlined />, color: 'info' };
    default:
      return { icon: <WarningOutlined />, color: 'info' };
  }
};

const HardwareAlertBanner = ({ alerts }) => {
  const [activeAlerts, setActiveAlerts] = useState(alerts || []);

  useEffect(() => {
    setActiveAlerts(alerts || []);
  }, [alerts]);

  useEffect(() => {
    const timers = activeAlerts.map((alert) =>
      setTimeout(() => {
        setActiveAlerts((prev) => prev.filter((item) => item.id !== alert.id));
      }, 10000),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [activeAlerts]);

  const handleResolve = (id) => {
    setActiveAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  if (!activeAlerts || activeAlerts.length === 0) {
    return null;
  }

  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
      {activeAlerts.map((alert) => {
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
              <Button
                size="small"
                type="primary"
                danger={color === 'error'}
                onClick={() => handleResolve(alert.id)}
              >
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
