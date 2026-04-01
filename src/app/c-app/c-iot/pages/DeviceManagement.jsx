// DeviceManagement.jsx – aligned with SRS UC_12, UC_13, UC_14, UC_15
import React, { useState, useMemo } from 'react';
import {
  Button, Input, Select, Space, Card, Row, Col,
  Typography, Table, Tag, Tooltip, Modal, Form,
  notification, Badge, Popconfirm,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, ExclamationCircleOutlined, WifiOutlined,
  DisconnectOutlined, ClockCircleOutlined, ApiOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

// ─── Constants per SRS §4.2.10 ───────────────────────────────────────────────
// UC_12: Device Type dropdown = Ultrasonic Sensor | IR Sensor | LPR Camera
const DEVICE_TYPES = ['Ultrasonic Sensor', 'IR Sensor', 'LPR Camera'];

// Per SRS post-condition UC_12: new device starts as "Inactive/Pending"
// Per SRS UC_18 / SR-NF1: live devices become "Online" after MQTT ping
// Per SRS UC_14 post-condition: deleted device leaves slot as "Malfunctioning"
const DEVICE_STATUSES = ['Online', 'Offline', 'Inactive', 'Pending'];

// ─── Mock data generator ──────────────────────────────────────────────────────
let mockIdCounter = 100;
const generateMockDevices = () => [
  { id: 'DEV-001', name: 'Sensor_Slot_A1', deviceId: 'AA:BB:CC:DD:EE:01', type: 'Ultrasonic Sensor', status: 'Online', linkedSlot: 'A1', createdAt: '2025-01-10' },
  { id: 'DEV-002', name: 'Sensor_Slot_A2', deviceId: 'AA:BB:CC:DD:EE:02', type: 'Ultrasonic Sensor', status: 'Online', linkedSlot: 'A2', createdAt: '2025-01-10' },
  { id: 'DEV-003', name: 'Sensor_Slot_B1', deviceId: 'AA:BB:CC:DD:EE:03', type: 'IR Sensor', status: 'Offline', linkedSlot: 'B1', createdAt: '2025-01-12' },
  { id: 'DEV-004', name: 'LPR_Gate_Entry', deviceId: 'AA:BB:CC:DD:EE:04', type: 'LPR Camera', status: 'Online', linkedSlot: null, createdAt: '2025-01-15' },
  { id: 'DEV-005', name: 'LPR_Gate_Exit', deviceId: 'AA:BB:CC:DD:EE:05', type: 'LPR Camera', status: 'Online', linkedSlot: null, createdAt: '2025-01-15' },
  { id: 'DEV-006', name: 'Sensor_Slot_C3', deviceId: 'AA:BB:CC:DD:EE:06', type: 'Ultrasonic Sensor', status: 'Inactive', linkedSlot: null, createdAt: '2025-02-01' },
  { id: 'DEV-007', name: 'Sensor_Slot_C4', deviceId: 'AA:BB:CC:DD:EE:07', type: 'IR Sensor', status: 'Pending', linkedSlot: null, createdAt: '2025-02-20' },
];

// ─── Status helpers ───────────────────────────────────────────────────────────
const statusConfig = {
  Online: { color: 'success', icon: <WifiOutlined />, label: 'Online' },
  Offline: { color: 'error', icon: <DisconnectOutlined />, label: 'Offline' },
  Inactive: { color: 'default', icon: <ClockCircleOutlined />, label: 'Inactive' },
  Pending: { color: 'warning', icon: <ClockCircleOutlined />, label: 'Pending' },
};

const typeColors = {
  'Ultrasonic Sensor': 'blue',
  'IR Sensor': 'purple',
  'LPR Camera': 'cyan',
};

// ─── Device Form Modal (Add / Edit) ──────────────────────────────────────────
// Implements UC_12 fields: Device Name, Device ID (MAC), Device Type
// Implements UC_12 E1: Duplicate Device ID
// Implements UC_13 E2: Invalid ID change (duplicate check)
const DeviceFormModal = ({ open, mode, initialData, allDevices, onClose, onSubmit }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        form.setFieldsValue({
          name: initialData.name,
          deviceId: initialData.deviceId,
          type: initialData.type,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, initialData, form]);

  const handleOk = () => {
    form.validateFields().then(values => {
      // E1 / E2: Duplicate Device ID check
      const duplicate = allDevices.find(d =>
        d.deviceId.toLowerCase() === values.deviceId.toLowerCase() &&
        (mode === 'add' || d.id !== initialData?.id)
      );
      if (duplicate) {
        form.setFields([{
          name: 'deviceId',
          errors: ['This Device ID is already registered. Please check the ID or edit the existing record.'],
        }]);
        return;
      }
      onSubmit(values);
      form.resetFields();
    });
  };

  return (
    <Modal
      title={
        <Space>
          <ApiOutlined style={{ color: '#1677ff' }} />
          <span>{mode === 'add' ? 'Add New Device' : 'Edit Device'}</span>
        </Space>
      }
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk}
      okText={mode === 'add' ? 'Register Device' : 'Save Changes'}
      destroyOnClose
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {/* UC_12: Device Name */}
        <Form.Item
          name="name"
          label="Device Name"
          rules={[
            { required: true, message: 'Device Name is required.' },
            { max: 50, message: 'Name must be 50 characters or fewer.' },
          ]}
          extra="A friendly label, e.g. Sensor_Slot_A1"
        >
          <Input placeholder="e.g. Sensor_Slot_A1" allowClear />
        </Form.Item>

        {/* UC_12: Device ID (MAC Address / Serial) */}
        <Form.Item
          name="deviceId"
          label="Device ID (MAC Address / Serial)"
          rules={[
            { required: true, message: 'Device ID is required.' },
            {
              pattern: /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$|^[A-Za-z0-9\-_]{4,32}$/,
              message: 'Enter a valid MAC address (AA:BB:CC:DD:EE:FF) or serial ID.',
            },
          ]}
          extra="Unique hardware identifier, e.g. AA:BB:CC:DD:EE:FF"
        >
          <Input
            placeholder="AA:BB:CC:DD:EE:FF"
            allowClear
            disabled={mode === 'edit'} // device ID should not normally be changed on edit
          />
        </Form.Item>

        {/* UC_12: Device Type dropdown */}
        <Form.Item
          name="type"
          label="Device Type"
          rules={[{ required: true, message: 'Please select a Device Type.' }]}
        >
          <Select placeholder="Select device type">
            {DEVICE_TYPES.map(t => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
        </Form.Item>

        {mode === 'add' && (
          <div style={{
            background: '#fffbe6', border: '1px solid #ffe58f',
            borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#614700',
          }}>
            ⚠ New devices are registered with <strong>Inactive / Pending</strong> status.
            Status will update to <strong>Online</strong> once the device connects to the MQTT broker.
          </div>
        )}
      </Form>
    </Modal>
  );
};

// ─── Delete Confirm Modal (UC_14) ─────────────────────────────────────────────
// Post-condition: any linked slot is updated to Gray (Malfunctioning)
const DeleteConfirmModal = ({ open, device, onClose, onDelete }) => {
  if (!device) return null;
  return (
    <Modal
      title={
        <Space style={{ color: '#cf1322' }}>
          <ExclamationCircleOutlined />
          <span>Delete Device</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={() => onDelete(device.id)}
      okText="Yes, Delete Device"
      okButtonProps={{ danger: true }}
      cancelText="Cancel"
      width={440}
    >
      <p>
        Are you sure you want to delete{' '}
        <strong>{device.name}</strong> ({device.deviceId})?
      </p>
      <p style={{ color: '#595959' }}>
        This action will unlink it from any assigned parking slots.
      </p>
      {device.linkedSlot && (
        <div style={{
          background: '#fff1f0', border: '1px solid #ffa39e',
          borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#cf1322',
        }}>
          ⚠ Slot <strong>{device.linkedSlot}</strong> is currently linked to this device.
          It will be set to <strong>Gray (Malfunctioning/Inactive)</strong> on the parking map.
        </div>
      )}
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DeviceManagement = () => {
  const [devices, setDevices] = useState(generateMockDevices);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editingDevice, setEditingDevice] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState(null);

  // ── Derived state ──
  const filteredDevices = useMemo(() => devices.filter(d => {
    const matchSearch =
      d.name.toLowerCase().includes(searchText.toLowerCase()) ||
      d.deviceId.toLowerCase().includes(searchText.toLowerCase());
    const matchType = typeFilter === 'All' || d.type === typeFilter;
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [devices, searchText, typeFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: devices.length,
    online: devices.filter(d => d.status === 'Online').length,
    offline: devices.filter(d => d.status === 'Offline').length,
    inactive: devices.filter(d => d.status === 'Inactive').length,
    pending: devices.filter(d => d.status === 'Pending').length,
    unlinked: devices.filter(d => !d.linkedSlot).length,
  }), [devices]);

  // ── Handlers ──
  const openAddModal = () => {
    setFormMode('add');
    setEditingDevice(null);
    setFormModalOpen(true);
  };

  const openEditModal = (device) => {
    setFormMode('edit');
    setEditingDevice(device);
    setFormModalOpen(true);
  };

  // UC_12 post-condition: new device status = "Inactive" (pending MQTT ping)
  const handleFormSubmit = (values) => {
    if (formMode === 'add') {
      mockIdCounter++;
      const newDevice = {
        ...values,
        id: `DEV-${mockIdCounter.toString().padStart(3, '0')}`,
        status: 'Inactive',   // SRS UC_12: "Inactive/Pending" on creation
        linkedSlot: null,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setDevices(prev => [newDevice, ...prev]);
      notification.success({
        message: 'Device Registered',
        description: `${newDevice.name} added with status Inactive. It will go Online once connected to MQTT.`,
      });
    } else {
      setDevices(prev => prev.map(d =>
        d.id === editingDevice.id ? { ...d, ...values } : d
      ));
      notification.success({ message: 'Device Updated', description: 'Changes saved successfully.' });
    }
    setFormModalOpen(false);
  };

  // UC_14: delete + unlink slot → Gray (simulated here as linkedSlot = null)
  const handleDeleteDevice = (id) => {
    const target = devices.find(d => d.id === id);
    setDevices(prev => prev.filter(d => d.id !== id));
    setDeleteModalOpen(false);
    notification.success({
      message: 'Device Deleted',
      description: target?.linkedSlot
        ? `Device removed. Slot ${target.linkedSlot} has been set to Malfunctioning (Gray).`
        : 'Device removed successfully.',
    });
  };

  // ── Table columns ──
  const columns = [
    {
      title: 'Device Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.id}</Text>
        </Space>
      ),
    },
    {
      title: 'Device ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      render: id => (
        <Text code style={{ fontSize: 12 }}>{id}</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: DEVICE_TYPES.map(t => ({ text: t, value: t })),
      onFilter: (value, record) => record.type === value,
      render: type => <Tag color={typeColors[type] || 'default'}>{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: DEVICE_STATUSES.map(s => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
      render: status => {
        const cfg = statusConfig[status] || { color: 'default', label: status, icon: null };
        return (
          <Badge
            status={cfg.color}
            text={
              <Space size={4}>
                {cfg.icon}
                <span>{cfg.label}</span>
              </Space>
            }
          />
        );
      },
    },
    {
      title: 'Linked Slot',
      dataIndex: 'linkedSlot',
      key: 'linkedSlot',
      render: slot => slot
        ? <Tag color="green">{slot}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: d => <Text style={{ fontSize: 12 }}>{d}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          {/* UC_13: Edit Device */}
          <Tooltip title="Edit Device">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          {/* UC_14: Delete Device */}
          <Tooltip title="Delete Device">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => { setDeletingDevice(record); setDeleteModalOpen(true); }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ── Render ──
  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>IoT Device Management</Title>
          <Text type="secondary">
            Register and manage ESP32 sensors, LPR cameras, and barrier controllers
          </Text>
        </div>
        {/* UC_12: Add Device */}
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Device
        </Button>
      </div>

      {/* Stats cards – per SRS UC_12 statuses */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Total</div>
            <div style={{ fontSize: 22, fontWeight: 'bold' }}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#b7eb8f', background: '#f6ffed' }}>
            <div style={{ fontSize: 12, color: '#389e0d' }}>Online</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#52c41a' }}>{stats.online}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#ffa39e', background: '#fff1f0' }}>
            <div style={{ fontSize: 12, color: '#cf1322' }}>Offline</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#f5222d' }}>{stats.offline}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#d9d9d9', background: '#fafafa' }}>
            <div style={{ fontSize: 12, color: '#595959' }}>Inactive</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#8c8c8c' }}>{stats.inactive}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#ffe58f', background: '#fffbe6' }}>
            <div style={{ fontSize: 12, color: '#d48806' }}>Pending</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#faad14' }}>{stats.pending}</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#91caff', background: '#e6f4ff' }}>
            <div style={{ fontSize: 12, color: '#0958d9' }}>Unlinked</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1677ff' }}>{stats.unlinked}</div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="Search by name or Device ID..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
        <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 160 }}>
          <Option value="All">All Types</Option>
          {DEVICE_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
        </Select>
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
          <Option value="All">All Status</Option>
          {DEVICE_STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
        </Select>
        <Text type="secondary" style={{ lineHeight: '32px' }}>
          Showing {filteredDevices.length} of {devices.length} devices
        </Text>
      </Space>

      {/* Device Table */}
      <Table
        columns={columns}
        dataSource={filteredDevices}
        rowKey="id"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: total => `${total} devices` }}
        locale={{ emptyText: 'No devices found. Click "Add Device" to register one.' }}
      />

      {/* UC_12 / UC_13: Add / Edit modal */}
      <DeviceFormModal
        open={formModalOpen}
        mode={formMode}
        initialData={editingDevice}
        allDevices={devices}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* UC_14: Delete confirmation */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        device={deletingDevice}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={handleDeleteDevice}
      />
    </div>
  );
};

export default DeviceManagement;