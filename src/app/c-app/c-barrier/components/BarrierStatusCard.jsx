import React from 'react';
import { Card, Typography, Space, Badge } from 'antd';
import { CaretRightOutlined, PauseOutlined, WarningOutlined, DisconnectOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const getStatusConfig = (status) => {
  switch (status) {
    case 'closed':
      return { color: 'success', icon: <PauseOutlined />, text: 'Closed (Ready)', colorCode: '#52c41a' };
    case 'open':
      return { color: 'warning', icon: <CaretRightOutlined />, text: 'Open', colorCode: '#faad14' };
    case 'error':
      return { color: 'error', icon: <WarningOutlined />, text: 'Error', colorCode: '#ff4d4f' };
    case 'offline':
      return { color: 'default', icon: <DisconnectOutlined />, text: 'Offline', colorCode: '#d9d9d9' };
    default:
      return { color: 'default', icon: <DisconnectOutlined />, text: 'Unknown', colorCode: '#d9d9d9' };
  }
};

const BarrierStatusCard = ({ barrierId, name, status, lastUpdated }) => {
  const config = getStatusConfig(status);

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16, borderLeft: `4px solid ${config.colorCode}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>{name}</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {barrierId}</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge 
            status={config.color} 
            text={
              <Space size={4}>
                {config.icon}
                <strong style={{ color: config.colorCode }}>{config.text}</strong>
              </Space>
            } 
          />
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default BarrierStatusCard;
