import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  notification,
} from 'antd';
import {
  ApiOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { Navigate, useParams } from 'react-router-dom';
import axiosClient from '../../../c-lib/axios/axiosClient.service';
import { CATEGORY_IOT_API, SENSOR_API } from '../../../c-lib/constants/auth-api.constant';

const { Title, Text } = Typography;
const { Option } = Select;

const getCategoryDisplayName = (category) => {
  if (!category) return null;
  return category.name || category.code || 'IoT Device';
};

const getStatus = (device) => {
  if (device.isOnline) return 'Online';
  return 'Offline';
};

const statusConfig = {
  Online: { color: 'success', icon: <WifiOutlined />, label: 'Online' },
  Offline: { color: 'error', icon: <DisconnectOutlined />, label: 'Offline' },
};

const DEVICE_STATUSES = ['Online', 'Offline'];
const CATEGORY_PAGE_CONFIG = {
  CA001: {
    entityName: 'Sensor',
    showLinkedSlot: true,
    showUnlinkedStat: true,
  },
  CA002: {
    entityName: 'Camera',
    showLinkedSlot: false,
    showUnlinkedStat: false,
  },
};

const DeviceFormModal = ({
  open,
  mode,
  initialData,
  onClose,
  onSubmit,
  confirmLoading,
  selectedCategory,
  pageConfig,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialData) {
      form.setFieldsValue({
        _id: initialData._id,
        code: initialData.code,
        status: getStatus(initialData),
        slotId:
          typeof initialData.slotId === 'object'
            ? initialData.slotId?.code || initialData.slotId?.nameSlot || ''
            : initialData.slotId || '',
      });
      return;
    }
    form.resetFields();
  }, [open, mode, initialData, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (_) {
      // form validation is shown by antd
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ApiOutlined style={{ color: '#1677ff' }} />
          <span>
            {mode === 'add'
              ? `Add ${selectedCategory?.name || pageConfig.entityName}`
              : `Edit ${pageConfig.entityName}`}
          </span>
        </Space>
      }
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      okText={mode === 'add' ? 'Add' : 'Save Changes'}
      destroyOnClose
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Category">
          <Input value={selectedCategory?.name || 'N/A'} disabled />
        </Form.Item>

        {mode === 'edit' && (
          <>
            <Form.Item name="_id" label="Device ID">
              <Input disabled />
            </Form.Item>
            <Form.Item name="code" label="Device Code">
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                {DEVICE_STATUSES.map((status) => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {pageConfig.showLinkedSlot && (
              <Form.Item name="slotId" label="Slot Code (Optional)">
                <Input placeholder="Enter slot code" allowClear />
              </Form.Item>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
};

const DeleteConfirmModal = ({ open, device, onClose, onDelete, confirmLoading, categoryName }) => {
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
      onOk={() => onDelete(device.code)}
      confirmLoading={confirmLoading}
      okText="Yes, Delete"
      okButtonProps={{ danger: true }}
      cancelText="Cancel"
      width={440}
    >
      <p>
        Are you sure you want to delete <strong>{device.code}</strong> from{' '}
        <strong>{categoryName || 'this category'}</strong>?
      </p>
    </Modal>
  );
};

const DeviceManagement = () => {
  const { categoryCode } = useParams();
  const [devices, setDevices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editingDevice, setEditingDevice] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.post(CATEGORY_IOT_API.GET_LIST, {});
      if (response?.success) {
        setCategories(response.data || []);
      } else {
        notification.error({
          message: 'Error fetching categories',
          description: response?.message || 'Unknown error',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error fetching categories',
        description: error.message,
      });
    } finally {
      setCategoriesLoaded(true);
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.post(SENSOR_API.GET_LIST, {});
      if (response?.success) {
        setDevices(response.data || []);
      } else {
        notification.error({
          message: 'Error fetching IoT devices',
          description: response?.message || 'Unknown error',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Error fetching IoT devices',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDevices();
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.code === categoryCode) || null,
    [categories, categoryCode],
  );

  const pageConfig = useMemo(
    () => ({
      entityName: 'Device',
      showLinkedSlot: true,
      showUnlinkedStat: true,
      ...(CATEGORY_PAGE_CONFIG[categoryCode] || {}),
    }),
    [categoryCode],
  );

  const categoryDevices = useMemo(
    () => devices.filter((device) => device.categoryId?.code === categoryCode),
    [devices, categoryCode],
  );

  const filteredDevices = useMemo(
    () =>
      categoryDevices.filter((device) => {
        const slotLabel = device.slotId
          ? typeof device.slotId === 'object'
            ? device.slotId?.nameSlot || device.slotId?.code || ''
            : String(device.slotId)
          : '';
        const matchSearch =
          String(device.code || '')
            .toLowerCase()
            .includes(searchText.toLowerCase()) || slotLabel.toLowerCase().includes(searchText.toLowerCase());
        const deviceStatus = getStatus(device);
        const matchStatus = statusFilter === 'All' || deviceStatus === statusFilter;
        return matchSearch && matchStatus;
      }),
    [categoryDevices, searchText, statusFilter],
  );

  const stats = useMemo(() => {
    let online = 0;
    let offline = 0;

    categoryDevices.forEach((device) => {
      const status = getStatus(device);
      if (status === 'Online') online += 1;
      else offline += 1;
    });

    return {
      total: categoryDevices.length,
      online,
      offline,
      unlinked: categoryDevices.filter((device) => !device.slotId).length,
    };
  }, [categoryDevices]);

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
      const statusPayload =
        formMode === 'edit'
          ? values.status === 'Online'
            ? { isOnline: true, isActive: 1 }
            : { isOnline: false, isActive: 1 }
          : {};

      const payload =
        formMode === 'add'
          ? {
              code: '0',
              categoryCode,
            }
          : {
              _id: editingDevice._id,
              code: editingDevice.code,
              categoryCode,
              ...statusPayload,
              ...(pageConfig.showLinkedSlot ? { slotId: values.slotId } : {}),
            };

      const response = await axiosClient.post(SENSOR_API.UPDATE, payload);
      if (response?.success) {
        notification.success({
          message: formMode === 'add' ? 'Device added' : 'Device updated',
          description: 'Changes saved successfully.',
        });
        setFormModalOpen(false);
        fetchDevices();
      } else {
        notification.error({
          message: 'Failed to save device',
          description: response?.message || 'Unknown error',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Action failed',
        description: error.message,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDevice = async (code) => {
    setFormLoading(true);
    try {
      const response = await axiosClient.post(SENSOR_API.DELETE, { items: [code] });
      if (response?.success) {
        notification.success({
          message: 'Device deleted',
          description: 'The device was removed successfully.',
        });
        setDeleteModalOpen(false);
        fetchDevices();
      } else {
        notification.error({
          message: 'Failed to delete device',
          description: response?.message || 'Unknown error',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Delete failed',
        description: error.message,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      title: 'Device Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
      render: (code) => <Text strong>{code}</Text>,
    },
    pageConfig.showLinkedSlot
      ? {
          title: 'Linked Slot',
          dataIndex: 'slotId',
          key: 'slotId',
          render: (slotId) => {
            if (!slotId) return <Text type="secondary">-</Text>;
            const label =
              typeof slotId === 'object'
                ? slotId?.nameSlot || slotId?.code || String(slotId._id)
                : slotId;
            return <Tag color="green">{label}</Tag>;
          },
        }
      : null,
    {
      title: 'Status',
      key: 'status',
      filters: DEVICE_STATUSES.map((status) => ({ text: status, value: status })),
      onFilter: (value, record) => getStatus(record) === value,
      render: (_, record) => {
        const status = getStatus(record);
        const config = statusConfig[status] || { color: 'default', label: status, icon: null };
        return (
          <Badge
            status={config.color}
            text={
              <Space size={4}>
                {config.icon}
                <span>{config.label}</span>
              </Space>
            }
          />
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit device">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          </Tooltip>
          <Tooltip title="Delete device">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                setDeletingDevice(record);
                setDeleteModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ].filter(Boolean);

  if (categoriesLoaded && !selectedCategory) {
    return <Navigate to="/admin/iot-categories" replace />;
  }

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {selectedCategory?.name || 'IoT Device Management'}
          </Title>
          <Text type="secondary">
            Manage {pageConfig.entityName.toLowerCase()} records filtered by category using the shared IoT API.
          </Text>
        </div>
        <Space>
          <Button onClick={fetchDevices} loading={loading} icon={<ReloadOutlined />}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} disabled={!selectedCategory}>
            Add {pageConfig.entityName}
          </Button>
        </Space>
      </div>

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
        {pageConfig.showUnlinkedStat && (
          <Col xs={12} sm={6} md={4}>
            <Card size="small" style={{ textAlign: 'center', borderColor: '#91caff', background: '#e6f4ff' }}>
              <div style={{ fontSize: 12, color: '#0958d9' }}>Unlinked</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1677ff' }}>{stats.unlinked}</div>
            </Card>
          </Col>
        )}
      </Row>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder={pageConfig.showLinkedSlot ? 'Search by device code or slot code...' : 'Search by device code...'}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
          <Option value="All">All Status</Option>
          {DEVICE_STATUSES.map((status) => (
            <Option key={status} value={status}>
              {status}
            </Option>
          ))}
        </Select>
        <Text type="secondary" style={{ lineHeight: '32px' }}>
          Showing {filteredDevices.length} of {categoryDevices.length} {pageConfig.entityName.toLowerCase()}s
        </Text>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredDevices}
        rowKey="_id"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 5, showSizeChanger: true, showTotal: (total) => `${total} devices` }}
        loading={loading}
        locale={{ emptyText: 'No devices found.' }}
      />

      <DeviceFormModal
        open={formModalOpen}
        mode={formMode}
        initialData={editingDevice}
        selectedCategory={selectedCategory}
        pageConfig={pageConfig}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        confirmLoading={formLoading}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        device={deletingDevice}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={handleDeleteDevice}
        confirmLoading={formLoading}
        categoryName={getCategoryDisplayName(selectedCategory)}
      />
    </div>
  );
};

export default DeviceManagement;
