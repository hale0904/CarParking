// d:\Dev\DoAn\CarParking\src\app\c-app\c-iot\pages\DeviceManagement.jsx
import React, { useState, useMemo } from 'react';
import { Button, Input, Select, Space, Card, Row, Col, Typography } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import DeviceTable from '../shared/DeviceTable';
import DeviceFormModal from '../shared/DeviceFormModal';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import { generateMockDevices, DEVICE_TYPES, DEVICE_STATUSES } from '../utils/deviceHelpers';

const { Title, Text } = Typography;
const { Option } = Select;

const DeviceManagement = () => {
  const [devices, setDevices] = useState(generateMockDevices());

  // Filters
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" | "edit"
  const [editingDevice, setEditingDevice] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState(null);

  // Derived data
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchSearch = device.name.toLowerCase().includes(searchText.toLowerCase()) ||
        device.deviceId.toLowerCase().includes(searchText.toLowerCase());
      const matchType = typeFilter === "All" || device.type === typeFilter;
      const matchStatus = statusFilter === "All" || device.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [devices, searchText, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: devices.length,
      online: devices.filter(d => d.status === "Online").length,
      offline: devices.filter(d => d.status === "Offline").length,
      unlinked: devices.filter(d => d.status === "Unlinked").length,
    };
  }, [devices]);

  // Handlers
  const openAddModal = () => {
    setFormMode("add");
    setEditingDevice(null);
    setFormModalOpen(true);
  };

  const openEditModal = (device) => {
    setFormMode("edit");
    setEditingDevice(device);
    setFormModalOpen(true);
  };

  const handleDeviceFormSubmit = (values) => {
    if (formMode === 'add') {
      const newDevice = {
        ...values,
        id: `DEV-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        status: "Online", // default mock status for new device
        linkedSlot: null,
      };
      setDevices([newDevice, ...devices]);
    } else {
      setDevices(devices.map(d => d.id === editingDevice.id ? { ...d, ...values } : d));
    }
    setFormModalOpen(false);
  };

  const openDeleteModal = (device) => {
    setDeletingDevice(device);
    setDeleteModalOpen(true);
  };

  const handleDeleteDevice = (id) => {
    setDevices(devices.filter(d => d.id !== id));
    setDeleteModalOpen(false);
  };

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>IoT Device Management</Title>
          <Text type="secondary">Manage sensors, cameras, and barrier devices</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Device
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#8c8c8c' }}>Total Devices</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#b7eb8f', backgroundColor: '#f6ffed' }}>
            <div style={{ fontSize: 14, color: '#389e0d' }}>Online</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{stats.online}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#ffa39e', backgroundColor: '#fff1f0' }}>
            <div style={{ fontSize: 14, color: '#cf1322' }}>Offline</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>{stats.offline}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#d9d9d9', backgroundColor: '#fafafa' }}>
            <div style={{ fontSize: 14, color: '#595959' }}>Unlinked</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#8c8c8c' }}>{stats.unlinked}</div>
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Input
          placeholder="Search by name or Device ID..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 120 }}
        >
          <Option value="All">All Types</Option>
          {DEVICE_TYPES.map(type => <Option key={type} value={type}>{type}</Option>)}
        </Select>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
        >
          <Option value="All">All Status</Option>
          {DEVICE_STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
        </Select>
      </Space>

      <DeviceTable
        data={filteredDevices}
        onEdit={openEditModal}
        onDeleteClick={openDeleteModal}
      />

      <DeviceFormModal
        open={formModalOpen}
        mode={formMode}
        initialData={editingDevice}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleDeviceFormSubmit}
      />

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
