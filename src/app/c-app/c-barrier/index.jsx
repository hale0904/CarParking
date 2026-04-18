import React, { useState } from 'react';
import { Typography, Row, Col, Tabs, Card, Space } from 'antd';
import { barrierList, barrierLogs, lprLogs, hardwareAlerts } from './barrierMocks';

import BarrierStatusCard from './components/BarrierStatusCard';
import ForceOpenButton from './components/ForceOpenButton';
import HardwareAlertBanner from './components/HardwareAlertBanner';
import BarrierLogTable from './components/BarrierLogTable';
import LprLogTable from './components/LprLogTable';

const { Title, Text } = Typography;

const BarrierControl = () => {
  const [barriers, setBarriers] = useState(barrierList);

  const handleForceOpen = (barrierId) => {
    // In a real app, this would call an API.
    // For now, optimistically update the status.
    setBarriers(prev => prev.map(b =>
      b.barrierId === barrierId ? { ...b, status: 'open', lastUpdated: new Date().toISOString() } : b
    ));

    // Simulate it closing after 10 seconds? Optional.
  };

  const tabItems = [
    {
      key: '1',
      label: 'Barrier Entry/Exit Logs',
      children: <BarrierLogTable logs={barrierLogs} />,
    },
    {
      key: '2',
      label: 'LPR OCR Logs',
      children: <LprLogTable lprLogs={lprLogs} />,
    },
  ];

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
      <Title level={2} style={{ marginBottom: 24 }}>Barrier Control</Title>

      <HardwareAlertBanner alerts={hardwareAlerts} />

      <Row gutter={[24, 24]}>
        {/* Left Column: Barrier Status */}
        <Col xs={24} lg={16}>
          <Card title="Live Gate Status" headStyle={{ fontWeight: 'bold' }}>
            {barriers.map(barrier => (
              <BarrierStatusCard
                key={barrier.barrierId}
                barrierId={barrier.barrierId}
                name={barrier.name}
                status={barrier.status}
                lastUpdated={barrier.lastUpdated}
              />
            ))}
          </Card>
        </Col>

        {/* Right Column: Manual Control */}
        <Col xs={24} lg={8}>
          <Card title="Manual Intervention" headStyle={{ fontWeight: 'bold' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {barriers.map(barrier => (
                <div key={barrier.barrierId}>
                  <Text strong>{barrier.name}</Text>
                  <div style={{ marginTop: 8 }}>
                    <ForceOpenButton
                      barrierId={barrier.barrierId}
                      status={barrier.status}
                      onConfirm={handleForceOpen}
                    />
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Bottom Section: Logs */}
      <Card style={{ marginTop: 24 }} bodyStyle={{ paddingTop: 0 }}>
        <Tabs defaultActiveKey="1" items={tabItems} size="large" />
      </Card>
    </div>
  );
};

export default BarrierControl;
