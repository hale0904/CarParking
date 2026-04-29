import React from 'react';
import { Card, Typography, Space, Badge, Tag } from 'antd';
import {
  CaretRightOutlined,
  PauseOutlined,
  WarningOutlined,
  DisconnectOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

const getStatusConfig = (status) => {
  switch (status) {
    case 'closed':
      return { color: 'success', icon: <PauseOutlined />, text: 'Closed (Ready)', colorCode: '#52c41a' };
    case 'opening':
      return { color: 'processing', icon: <ThunderboltOutlined />, text: 'Opening', colorCode: '#1677ff' };
    case 'open':
      return { color: 'warning', icon: <CaretRightOutlined />, text: 'Open', colorCode: '#faad14' };
    case 'waiting_clear':
      return { color: 'processing', icon: <SafetyCertificateOutlined />, text: 'Waiting Safety Clear', colorCode: '#13c2c2' };
    case 'closing':
      return { color: 'processing', icon: <PauseOutlined />, text: 'Closing', colorCode: '#2f54eb' };
    case 'failsafe_open':
      return { color: 'warning', icon: <WarningOutlined />, text: 'Fail-Safe Open', colorCode: '#fa8c16' };
    case 'manual_override':
      return { color: 'warning', icon: <CaretRightOutlined />, text: 'Manual Override', colorCode: '#d48806' };
    case 'jammed':
      return { color: 'error', icon: <WarningOutlined />, text: 'Mechanical Jam', colorCode: '#cf1322' };
    case 'offline':
      return { color: 'default', icon: <DisconnectOutlined />, text: 'Offline', colorCode: '#d9d9d9' };
    default:
      return { color: 'default', icon: <DisconnectOutlined />, text: 'Unknown', colorCode: '#d9d9d9' };
  }
};

const BarrierStatusCard = ({
  barrierId,
  name,
  status,
  lastUpdated,
  laneType,
  networkMode,
  safetyLoopClear,
  vehicleDetected,
  powerState,
  lastCommandSource,
  lastCommandReason,
  lastCommandLatencyMs,
}) => {
  const config = getStatusConfig(status);

  return (
    <Card size="small" style={{ marginBottom: 16, borderLeft: `4px solid ${config.colorCode}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>{name}</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {barrierId}</Text>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag color={laneType === 'entry' ? 'blue' : 'purple'}>{laneType === 'entry' ? 'Entry Lane' : 'Exit Lane'}</Tag>
            <Tag color={networkMode === 'online' ? 'green' : 'red'}>{networkMode === 'online' ? 'Online Mode' : 'Offline Mode'}</Tag>
            <Tag color={safetyLoopClear ? 'green' : 'orange'}>{safetyLoopClear ? 'Safety Clear' : 'Safety Blocked'}</Tag>
            <Tag color={vehicleDetected ? 'gold' : 'default'}>{vehicleDetected ? 'Vehicle Present' : 'Lane Empty'}</Tag>
            <Tag color={powerState === 'normal' ? 'default' : 'volcano'}>{powerState === 'normal' ? 'Power Normal' : 'Power Loss Simulated'}</Tag>
          </div>
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
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Last command: {lastCommandSource || 'system'} / {lastCommandReason || 'N/A'}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Relay latency: {lastCommandLatencyMs ?? 0} ms
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default BarrierStatusCard;
