import React, { useCallback, useEffect, useState } from 'react';
import { Typography, Row, Col, Tabs, Card, Space, Button, Empty, notification } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { barrierLogs, lprLogs, hardwareAlerts } from './barrierMocks';
import axiosClient from '../../c-lib/axios/axiosClient.service';
import { CAMERA_API } from '../../c-lib/constants/auth-api.constant';

import BarrierStatusCard from './components/BarrierStatusCard';
import ForceOpenButton from './components/ForceOpenButton';
import HardwareAlertBanner from './components/HardwareAlertBanner';
import BarrierLogTable from './components/BarrierLogTable';
import LprLogTable from './components/LprLogTable';

const { Title, Text } = Typography;

const mapCameraToBarrier = (camera) => ({
  _id: camera._id,
  barrierId: camera.code,
  name: camera.code,
  status: camera.isOnline ? 'closed' : 'offline',
  lastUpdated: new Date().toISOString(),
});

const BarrierControl = () => {
  const [barriers, setBarriers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.post(CAMERA_API.GET_LIST, {});
      if (response?.success) {
        setBarriers((response.data || []).map(mapCameraToBarrier));
      } else {
        notification.error({
          message: 'Failed to load camera list',
          description: response?.message || 'The API returned an unknown error.',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Failed to load camera list',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleForceOpen = (barrierId) => {
    setBarriers(prev => prev.map(b =>
      b.barrierId === barrierId ? { ...b, status: 'open', lastUpdated: new Date().toISOString() } : b
    ));
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12 }}>
        <Title level={2} style={{ margin: 0 }}>Barrier Control</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchCameras} loading={loading}>
          Refresh Camera
        </Button>
      </div>

      <HardwareAlertBanner alerts={hardwareAlerts} />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Live Gate Status" headStyle={{ fontWeight: 'bold' }} loading={loading}>
            {barriers.length > 0 ? (
              barriers.map(barrier => (
                <BarrierStatusCard
                  key={barrier.barrierId}
                  barrierId={barrier.barrierId}
                  name={barrier.name}
                  status={barrier.status}
                  lastUpdated={barrier.lastUpdated}
                />
              ))
            ) : (
              <Empty description="No cameras found" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Manual Intervention" headStyle={{ fontWeight: 'bold' }} loading={loading}>
            {barriers.length > 0 ? (
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
            ) : (
              <Empty description="No camera data available" />
            )}
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }} bodyStyle={{ paddingTop: 0 }}>
        <Tabs defaultActiveKey="1" items={tabItems} size="large" />
      </Card>
    </div>
  );
};

export default BarrierControl;
