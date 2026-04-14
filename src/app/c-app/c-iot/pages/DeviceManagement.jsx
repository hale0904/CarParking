import React, { useState, useEffect, useMemo } from 'react';
import {
  Button, Input, Space, Card, Row, Col, Select,
  Typography, Table, Tag, Tooltip, Modal, Form,
  notification, Badge
} from 'antd';
import {
  SearchOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, ExclamationCircleOutlined, WifiOutlined,
  DisconnectOutlined, ClockCircleOutlined, ApiOutlined,
} from '@ant-design/icons';
import axiosClient from '../../../c-lib/axios/axiosClient.service';
import { SENSOR_API, CATEGORY_IOT_API } from '../../../c-lib/constants/auth-api.constant';

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Status helpers ───────────────────────────────────────────────────────────
const getCategoryName = (category) => {
  if (!category) return null;
  if (category.code === 'CA001') return 'Sensor';
  if (category.code === 'CA002') return 'Camera';
  return category.name;
};

function getStatus(sensor) {
  if (sensor.isOnline) return 'Online';
  if (sensor.isActive === 1) return 'Offline';
  return 'Inactive';
}

const statusConfig = {
  Online: { color: 'success', icon: <WifiOutlined />, label: 'Online' },
  Offline: { color: 'error', icon: <DisconnectOutlined />, label: 'Offline' },
  Inactive: { color: 'default', icon: <ClockCircleOutlined />, label: 'Inactive' },
};
const DEVICE_STATUSES = ['Online', 'Offline', 'Inactive'];

// ─── Device Form Modal (Add / Edit) ──────────────────────────────────────────
const DeviceFormModal = ({ open, mode, initialData, onClose, onSubmit, confirmLoading, categories }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        form.setFieldsValue({
          _id: initialData._id,
          code: initialData.code,
          slotId: initialData.slotId,
          categoryCode: initialData.categoryId?.code,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, initialData, form]);

  const handleOk = () => {
    form.validateFields().then(values => {
      onSubmit(values);
    });
  };

  return (
    <Modal
      title={
        <Space>
          <ApiOutlined style={{ color: '#1677ff' }} />
          <span>{mode === 'add' ? 'Add New Sensor' : 'Edit Sensor'}</span>
        </Space>
      }
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      okText={mode === 'add' ? 'Add' : 'Save Changes'}
      destroyOnClose
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        {mode === 'edit' && (
          <>
            <Form.Item name="_id" label="Device ID">
              <Input disabled />
            </Form.Item>
            <Form.Item name="code" label="Sensor Code">
              <Input disabled />
            </Form.Item>
            <Form.Item name="slotId" label="Slot ID (Optional)">
              <Input placeholder="Linked Slot ID" allowClear />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="categoryCode"
          label="Category"
          rules={[{ required: true, message: 'Please select a category.' }]}
        >
          <Select placeholder="Select category" allowClear>
            {categories?.map(c => (
              <Option key={c._id} value={c.code}>{getCategoryName(c)}</Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────
const DeleteConfirmModal = ({ open, device, onClose, onDelete, confirmLoading }) => {
  if (!device) return null;
  return (
    <Modal
      title={
        <Space style={{ color: '#cf1322' }}>
          <ExclamationCircleOutlined />
          <span>Delete Sensor</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={() => onDelete(device.code)}
      confirmLoading={confirmLoading}
      okText="Yes, Delete Sensor"
      okButtonProps={{ danger: true }}
      cancelText="Cancel"
      width={440}
    >
      <p>
        Are you sure you want to delete Sensor{' '}
        <strong>{device.code}</strong>?
      </p>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editingDevice, setEditingDevice] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState(null);

  // ── Fetch Data ──
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.post(SENSOR_API.GET_LIST, {});
      console.log('RESPONSE:', response);
      if (response.success) {
        setDevices(response.data || []);
      } else {
        notification.error({ message: 'Error fetching sensors', description: response?.message || 'Unknown error' });
      }
    } catch (error) {
      notification.error({ message: 'Error fetching sensors', description: error.message });
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.post(CATEGORY_IOT_API.GET_LIST, {});
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      notification.error({ message: 'Error fetching categories', description: error.message });
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchCategories();
  }, []);

  // ── Derived state ──
  const filteredDevices = useMemo(() => devices.filter(d => {
    const matchSearch = String(d.code || '').toLowerCase().includes(searchText.toLowerCase()) ||
      String(d.slotId || '').toLowerCase().includes(searchText.toLowerCase());
    const dStatus = getStatus(d);
    const matchStatus = statusFilter === 'All' || dStatus === statusFilter;
    return matchSearch && matchStatus;
  }), [devices, searchText, statusFilter]);

  const stats = useMemo(() => {
    let online = 0, offline = 0, inactive = 0;
    devices.forEach(d => {
      const st = getStatus(d);
      if (st === 'Online') online++;
      else if (st === 'Offline') offline++;
      else if (st === 'Inactive') inactive++;
    });
    return {
      total: devices.length,
      online,
      offline,
      inactive,
      unlinked: devices.filter(d => !d.slotId).length,
    };
  }, [devices]);

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

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      let payload;
      if (formMode === 'add') {
        payload = {
          code: '0',
          categoryCode: values.categoryCode,
        };
      } else {
        payload = {
          _id: editingDevice._id,
          code: editingDevice.code,
          slotId: values.slotId,
          categoryCode: values.categoryCode,
        };
      }
      const res = await axiosClient.post(SENSOR_API.UPDATE, payload);
      if (res.success) {
        notification.success({
          message: `Sensor ${formMode === 'add' ? 'Added' : 'Updated'}`,
          description: 'Changes saved successfully.'
        });
        setFormModalOpen(false);
        fetchDevices();
      } else {
        notification.error({
          message: `Failed to ${formMode} sensor`,
          description: res?.message
        });
      }
    } catch (error) {
      notification.error({ message: 'Action Failed', description: error.message });
    }
    setFormLoading(false);
  };

  const handleDeleteDevice = async (code) => {
    setFormLoading(true);
    try {
      const res = await axiosClient.post(SENSOR_API.DELETE, { items: [code] });
      if (res.success) {
        notification.success({ message: 'Sensor Deleted', description: 'Sensor removed successfully.' });
        setDeleteModalOpen(false);
        fetchDevices();
      } else {
        notification.error({ message: 'Failed to delete sensor', description: res?.message });
      }
    } catch (error) {
      notification.error({ message: 'Delete Failed', description: error.message });
    }
    setFormLoading(false);
  };

  // ── Table columns ──
  const columns = [
    {
      title: 'Sensor Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
      render: (code, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{code}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record._id}</Text>
        </Space>
      ),
    },
    {
      title: 'Linked Slot ID',
      dataIndex: 'slotId',
      key: 'slotId',
      render: slotId => slotId
        ? <Tag color="green">{slotId}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      key: 'status',
      filters: DEVICE_STATUSES.map(s => ({ text: s, value: s })),
      onFilter: (value, record) => getStatus(record) === value,
      render: (_, record) => {
        const status = getStatus(record);
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
      title: 'Type',
      dataIndex: 'categoryId',
      key: 'category',
      render: category => {
        const text = getCategoryName(category);
        const color = text === 'Camera' ? 'red' : 'blue';
        return text
          ? <Tag color={color}>{text}</Tag>
          : <Text type="secondary">—</Text>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Sensor">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Sensor">
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
          <Title level={2} style={{ margin: 0 }}>IoT Sensor Management</Title>
          <Text type="secondary">
            Manage sensors and sync dynamically with backend endpoints
          </Text>
        </div>
        <Space>
          <Button onClick={fetchDevices} loading={loading}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Add Sensor
          </Button>
        </Space>
      </div>

      {/* Stats cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Total</div>
            <div style={{ fontSize: 22, fontWeight: 'bold' }}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#b7eb8f', background: '#f6ffed' }}>
            <div style={{ fontSize: 12, color: '#389e0d' }}>Online</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#52c41a' }}>{stats.online}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#ffa39e', background: '#fff1f0' }}>
            <div style={{ fontSize: 12, color: '#cf1322' }}>Offline</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#f5222d' }}>{stats.offline}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#d9d9d9', background: '#fafafa' }}>
            <div style={{ fontSize: 12, color: '#595959' }}>Inactive</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#8c8c8c' }}>{stats.inactive}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#91caff', background: '#e6f4ff' }}>
            <div style={{ fontSize: 12, color: '#0958d9' }}>Unlinked</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1677ff' }}>{stats.unlinked}</div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="Search by code or slot id..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 260 }}
          allowClear
        />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
          <Option value="All">All Status</Option>
          {DEVICE_STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
        </Select>
        <Text type="secondary" style={{ lineHeight: '32px' }}>
          Showing {filteredDevices.length} of {devices.length} sensors
        </Text>
      </Space>

      {/* Device Table */}
      <Table
        columns={columns}
        dataSource={filteredDevices}
        rowKey="_id"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 5, showSizeChanger: true, showTotal: total => `${total} sensors` }}
        loading={loading}
        locale={{ emptyText: 'No sensors found.' }}
      />

      {/* Add / Edit modal */}
      <DeviceFormModal
        open={formModalOpen}
        mode={formMode}
        initialData={editingDevice}
        categories={categories}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        confirmLoading={formLoading}
      />

      {/* Delete confirmation */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        device={deletingDevice}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={handleDeleteDevice}
        confirmLoading={formLoading}
      />
    </div>
  );
};

export default DeviceManagement;