import React, { useMemo, useState } from 'react';
import {
  Typography,
  Row,
  Col,
  Tabs,
  Card,
  Space,
  Button,
  Empty,
  notification,
  Tag,
  Statistic,
  Switch,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PoweroffOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  initialBarriers,
  initialBarrierLogs,
  initialHardwareAlerts,
  initialLprLogs,
} from './barrierMocks';
import BarrierStatusCard from './components/BarrierStatusCard';
import ForceOpenButton from './components/ForceOpenButton';
import HardwareAlertBanner from './components/HardwareAlertBanner';
import BarrierLogTable from './components/BarrierLogTable';
import LprLogTable from './components/LprLogTable';

const { Title, Text } = Typography;

const randomLatency = () => 280 + Math.floor(Math.random() * 360);
const nextId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const BarrierControl = () => {
  const [barriers, setBarriers] = useState(initialBarriers);
  const [barrierLogs, setBarrierLogs] = useState(initialBarrierLogs);
  const [lprLogs] = useState(initialLprLogs);
  const [alerts, setAlerts] = useState(initialHardwareAlerts);
  const [loading, setLoading] = useState(false);

  const barrierMap = useMemo(
    () => Object.fromEntries(barriers.map((barrier) => [barrier.barrierId, barrier])),
    [barriers],
  );

  const pushAlert = (alert) => {
    setAlerts((prev) => [
      {
        id: nextId('alert'),
        timestamp: new Date().toISOString(),
        ...alert,
      },
      ...prev,
    ]);
  };

  const appendBarrierLog = (log) => {
    setBarrierLogs((prev) => [
      {
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        ...log,
      },
      ...prev,
    ]);
  };

  const updateBarrier = (barrierId, updater) => {
    setBarriers((prev) =>
      prev.map((barrier) =>
        barrier.barrierId === barrierId
          ? {
              ...barrier,
              ...updater(barrier),
              lastUpdated: new Date().toISOString(),
            }
          : barrier,
      ),
    );
  };

  const simulateCloseFlow = (barrierId, trigger, paymentStatus = 'N/A') => {
    window.setTimeout(() => {
      let shouldBlock = false;
      let laneType = 'entry';

      updateBarrier(barrierId, (barrier) => {
        laneType = barrier.laneType;
        if (barrier.status === 'failsafe_open' || barrier.status === 'jammed') return barrier;
        if (!barrier.safetyLoopClear || barrier.vehicleDetected) {
          shouldBlock = true;
          return {
            status: 'waiting_clear',
            lastCommandSource: 'system',
            lastCommandReason: 'Waiting for safety loop to clear',
            lastCommandLatencyMs: 0,
          };
        }
        return {
          status: 'closing',
          lastCommandSource: 'system',
          lastCommandReason: 'Safety loop clear, closing barrier',
          lastCommandLatencyMs: 0,
        };
      });

      if (shouldBlock) {
        appendBarrierLog({
          barrierId,
          laneType,
          licensePlate: 'ACTIVE VEHICLE',
          trigger,
          paymentStatus,
          commandStatus: 'Blocked',
          safetyStatus: 'Blocked',
          mode: 'Automatic',
          latencyMs: 0,
          notes: 'Close command delayed until safety loop reports clear.',
        });
        return;
      }

      window.setTimeout(() => {
        updateBarrier(barrierId, () => ({
          status: 'closed',
          vehicleDetected: false,
          lastCommandSource: 'system',
          lastCommandReason: 'Vehicle passed, barrier closed',
          lastCommandLatencyMs: 0,
        }));
        appendBarrierLog({
          barrierId,
          laneType,
          licensePlate: 'N/A',
          trigger,
          paymentStatus,
          commandStatus: 'Closed',
          safetyStatus: 'Clear',
          mode: 'Automatic',
          latencyMs: 0,
          notes: 'Barrier closed after safety loop confirmation.',
        });
      }, 1200);
    }, 1600);
  };

  const openBarrier = ({
    barrierId,
    trigger,
    paymentStatus = 'N/A',
    licensePlate = 'N/A',
    mode = 'Automatic',
  }) => {
    const barrier = barrierMap[barrierId];
    if (!barrier) return;

    if (barrier.mechanicalJam) {
      pushAlert({
        type: 'Mechanical Jam',
        severity: 'error',
        message: `${barrier.name} is mechanically jammed. Barrier opening command rejected.`,
      });
      appendBarrierLog({
        barrierId,
        laneType: barrier.laneType,
        licensePlate,
        trigger,
        paymentStatus,
        commandStatus: 'Failed',
        safetyStatus: barrier.safetyLoopClear ? 'Clear' : 'Blocked',
        mode,
        latencyMs: 0,
        notes: 'Mechanical jam prevented opening.',
      });
      updateBarrier(barrierId, () => ({
        status: 'jammed',
        lastCommandSource: mode === 'Manual Override' ? 'admin' : 'system',
        lastCommandReason: 'Mechanical jam',
        lastCommandLatencyMs: 0,
      }));
      return;
    }

    if (barrier.networkMode === 'offline' && mode !== 'Manual Override') {
      pushAlert({
        type: 'Offline Override',
        severity: 'warning',
        message: `${barrier.name} is offline. Automatic command was blocked until an admin override is used.`,
      });
      appendBarrierLog({
        barrierId,
        laneType: barrier.laneType,
        licensePlate,
        trigger,
        paymentStatus,
        commandStatus: 'Failed',
        safetyStatus: barrier.safetyLoopClear ? 'Clear' : 'Blocked',
        mode,
        latencyMs: 0,
        notes: 'Network offline. Automatic command blocked.',
      });
      return;
    }

    const latencyMs = randomLatency();
    updateBarrier(barrierId, () => ({
      status: mode === 'Manual Override' ? 'manual_override' : 'opening',
      vehicleDetected: true,
      lastCommandSource: mode === 'Manual Override' ? 'admin' : 'system',
      lastCommandReason: trigger,
      lastCommandLatencyMs: latencyMs,
    }));

    window.setTimeout(() => {
      updateBarrier(barrierId, () => ({
        status: mode === 'Manual Override' ? 'manual_override' : 'open',
        vehicleDetected: true,
        lastCommandSource: mode === 'Manual Override' ? 'admin' : 'system',
        lastCommandReason: `${trigger} / relay pulse 500ms`,
        lastCommandLatencyMs: latencyMs,
      }));
      appendBarrierLog({
        barrierId,
        laneType: barrier.laneType,
        licensePlate,
        trigger,
        paymentStatus,
        commandStatus: 'Opened',
        safetyStatus: barrier.safetyLoopClear ? 'Clear' : 'Blocked',
        mode,
        latencyMs,
        notes:
          latencyMs <= 1000
            ? 'Relay was triggered within the 1-second requirement.'
            : 'Relay exceeded the 1-second requirement.',
      });
      if (mode !== 'Manual Override') {
        simulateCloseFlow(barrierId, trigger, paymentStatus);
      }
    }, 500);
  };

  const handleEntryAuth = (barrierId) => {
    const licensePlate = `30A-${Math.floor(10000 + Math.random() * 89999)}`;
    openBarrier({
      barrierId,
      trigger: 'LPR verified',
      licensePlate,
      paymentStatus: 'N/A',
    });
  };

  const handleExitPayment = (barrierId) => {
    const licensePlate = `51H-${Math.floor(10000 + Math.random() * 89999)}`;
    openBarrier({
      barrierId,
      trigger: 'Payment success',
      licensePlate,
      paymentStatus: 'Paid',
    });
  };

  const handlePaymentTimeout = (barrierId) => {
    const barrier = barrierMap[barrierId];
    pushAlert({
      type: 'Payment Timeout',
      severity: 'warning',
      message: `${barrier?.name || barrierId} kept closed because the payment flow timed out.`,
    });
    appendBarrierLog({
      barrierId,
      laneType: barrier?.laneType || 'exit',
      licensePlate: 'PENDING EXIT',
      trigger: 'Payment timeout',
      paymentStatus: 'Timeout',
      commandStatus: 'Blocked',
      safetyStatus: barrier?.safetyLoopClear ? 'Clear' : 'Blocked',
      mode: 'Automatic',
      latencyMs: 0,
      notes: 'Barrier remained closed. Admin may use manual override.',
    });
    notification.warning({
      message: 'Payment Timeout',
      description:
        'Barrier remains closed until payment succeeds or an admin forces it open.',
    });
  };

  const handleForceOpen = (barrierId) => {
    openBarrier({
      barrierId,
      trigger:
        barrierMap[barrierId]?.networkMode === 'offline'
          ? 'Offline manual override'
          : 'Admin force open',
      paymentStatus: 'Override',
      licensePlate: 'MANUAL',
      mode: 'Manual Override',
    });
  };

  const toggleSafetyLoop = (barrierId, checked) => {
    updateBarrier(barrierId, () => ({ safetyLoopClear: checked }));
  };

  const toggleNetworkMode = (barrierId, checked) => {
    updateBarrier(barrierId, (barrier) => ({
      networkMode: checked ? 'online' : 'offline',
      status:
        !checked && barrier.status !== 'failsafe_open' && barrier.status !== 'jammed'
          ? 'offline'
          : barrier.status === 'offline'
            ? 'closed'
            : barrier.status,
    }));
  };

  const toggleVehiclePresence = (barrierId, checked) => {
    updateBarrier(barrierId, () => ({ vehicleDetected: checked }));
  };

  const toggleMechanicalJam = (barrierId, checked) => {
    updateBarrier(barrierId, () => ({
      mechanicalJam: checked,
      status: checked ? 'jammed' : 'closed',
    }));
    if (checked) {
      pushAlert({
        type: 'Mechanical Jam',
        severity: 'error',
        message: `${barrierMap[barrierId]?.name || barrierId} is jammed and requires technician intervention.`,
      });
    }
  };

  const triggerFailSafe = (barrierId) => {
    updateBarrier(barrierId, () => ({
      powerState: 'loss',
      status: 'failsafe_open',
      vehicleDetected: false,
      lastCommandSource: 'system',
      lastCommandReason: 'Power loss fail-safe release',
      lastCommandLatencyMs: 0,
    }));
    pushAlert({
      type: 'Fail-Safe Release',
      severity: 'warning',
      message: `${barrierMap[barrierId]?.name || barrierId} switched to fail-safe open because power loss was simulated.`,
    });
    appendBarrierLog({
      barrierId,
      laneType: barrierMap[barrierId]?.laneType || 'entry',
      licensePlate: 'N/A',
      trigger: 'Power loss',
      paymentStatus: 'N/A',
      commandStatus: 'Opened',
      safetyStatus: 'Clear',
      mode: 'Fail-Safe',
      latencyMs: 0,
      notes: 'Barrier released automatically to prevent vehicles from being trapped.',
    });
  };

  const resetBarrier = (barrierId) => {
    updateBarrier(barrierId, () => ({
      status: 'closed',
      networkMode: 'online',
      vehicleDetected: false,
      safetyLoopClear: true,
      mechanicalJam: false,
      powerState: 'normal',
      lastCommandSource: 'system',
      lastCommandReason: 'Reset to ready state',
      lastCommandLatencyMs: 0,
    }));
    notification.success({
      message: 'Barrier Reset',
      description: `${barrierMap[barrierId]?.name || barrierId} returned to ready state.`,
    });
  };

  const fetchSimulation = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 450);
  };

  const uptimeStats = useMemo(() => {
    const total = barriers.length || 1;
    const healthy = barriers.filter(
      (barrier) =>
        barrier.networkMode === 'online' &&
        !barrier.mechanicalJam &&
        barrier.powerState === 'normal',
    ).length;
    return ((healthy / total) * 100).toFixed(1);
  }, [barriers]);

  const tabItems = [
    {
      key: '1',
      label: 'Barrier Events',
      children: <BarrierLogTable logs={barrierLogs} />,
    },
    {
      key: '2',
      label: 'LPR Review',
      children: <LprLogTable lprLogs={lprLogs} />,
    },
  ];

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>Barrier Control</Title>
          <Text type="secondary">
            Mock implementation aligned with the use case: automatic open, safety-based close, fail-safe release, and manual override.
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchSimulation} loading={loading}>
          Refresh Simulation
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card bordered={false}>
            <Statistic title="Peak-Hour Uptime Target" value={99.5} suffix="%" />
            <Text type="secondary">Required by SR-NF4</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false}>
            <Statistic title="Simulated Live Availability" value={uptimeStats} suffix="%" />
            <Text type="secondary">Based on online, power, and jam state</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false}>
            <Statistic title="Relay SLA" value="< 1s" />
            <Text type="secondary">Pulse is simulated at 500 ms with latency logging</Text>
          </Card>
        </Col>
      </Row>

      <HardwareAlertBanner alerts={alerts} />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card title="Live Barrier State" headStyle={{ fontWeight: 'bold' }} loading={loading}>
            {barriers.length > 0 ? (
              barriers.map((barrier) => <BarrierStatusCard key={barrier.barrierId} {...barrier} />)
            ) : (
              <Empty description="No barriers available" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Use-Case Simulation Controls" headStyle={{ fontWeight: 'bold' }} loading={loading}>
            {barriers.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {barriers.map((barrier) => (
                  <Card key={barrier.barrierId} size="small" style={{ background: '#fafafa' }}>
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                      <div>
                        <Text strong>{barrier.name}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={barrier.laneType === 'entry' ? 'blue' : 'purple'}>
                            {barrier.laneType === 'entry' ? 'Entry Flow' : 'Exit Flow'}
                          </Tag>
                          <Tag>{barrier.barrierId}</Tag>
                        </div>
                      </div>

                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Button
                            block
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleEntryAuth(barrier.barrierId)}
                            disabled={barrier.laneType !== 'entry'}
                          >
                            LPR Verified
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            block
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleExitPayment(barrier.barrierId)}
                            disabled={barrier.laneType !== 'exit'}
                          >
                            Payment Success
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            block
                            icon={<CloseCircleOutlined />}
                            onClick={() => handlePaymentTimeout(barrier.barrierId)}
                            disabled={barrier.laneType !== 'exit'}
                          >
                            Payment Timeout
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            block
                            icon={<PoweroffOutlined />}
                            onClick={() => triggerFailSafe(barrier.barrierId)}
                          >
                            Simulate Power Loss
                          </Button>
                        </Col>
                      </Row>

                      <ForceOpenButton
                        barrierId={barrier.barrierId}
                        status={barrier.status}
                        networkMode={barrier.networkMode}
                        mechanicalJam={barrier.mechanicalJam}
                        onConfirm={handleForceOpen}
                      />

                      <Divider style={{ margin: '4px 0' }} />

                      <Row gutter={[8, 12]}>
                        <Col span={12}>
                          <Text type="secondary">Network Online</Text>
                          <br />
                          <Switch
                            checked={barrier.networkMode === 'online'}
                            onChange={(checked) => toggleNetworkMode(barrier.barrierId, checked)}
                            checkedChildren="Online"
                            unCheckedChildren="Offline"
                          />
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Safety Loop Clear</Text>
                          <br />
                          <Switch
                            checked={barrier.safetyLoopClear}
                            onChange={(checked) => toggleSafetyLoop(barrier.barrierId, checked)}
                            checkedChildren="Clear"
                            unCheckedChildren="Blocked"
                          />
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Vehicle Detected</Text>
                          <br />
                          <Switch
                            checked={barrier.vehicleDetected}
                            onChange={(checked) => toggleVehiclePresence(barrier.barrierId, checked)}
                            checkedChildren="Present"
                            unCheckedChildren="Empty"
                          />
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Mechanical Jam</Text>
                          <br />
                          <Switch
                            checked={barrier.mechanicalJam}
                            onChange={(checked) => toggleMechanicalJam(barrier.barrierId, checked)}
                            checkedChildren="Jammed"
                            unCheckedChildren="Normal"
                          />
                        </Col>
                      </Row>

                      <Button
                        block
                        icon={<PlayCircleOutlined />}
                        onClick={() => resetBarrier(barrier.barrierId)}
                      >
                        Reset Barrier State
                      </Button>
                    </Space>
                  </Card>
                ))}
              </Space>
            ) : (
              <Empty description="No barrier simulation data available" />
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
