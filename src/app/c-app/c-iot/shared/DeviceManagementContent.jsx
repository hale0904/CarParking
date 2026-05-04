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
import { Navigate } from 'react-router-dom';
import axiosClient from '../../../c-lib/axios/axiosClient.service';
import { CATEGORY_IOT_API } from '../../../c-lib/api/iot.api';
import { useAdminI18n } from '../../../c-lib/i18n/adminI18n';

const { Title, Text } = Typography;
const { Option } = Select;

const getCategoryDisplayName = (category, fallbackName) => {
  if (!category) return fallbackName;
  return category.name || category.code || fallbackName;
};

const getStatus = (device) => {
  if (device.isOnline) return 'Online';
  return 'Offline';
};

const DEVICE_STATUSES = ['Online', 'Offline'];

const getSlotLabel = (slotValue) => {
  if (!slotValue) return '';
  if (typeof slotValue === 'object') {
    return slotValue?.nameSlot || slotValue?.code || '';
  }
  return String(slotValue);
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
  getDeviceStatus,
}) => {
  const { t } = useAdminI18n();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialData) {
      const nextValues = {
        _id: initialData._id,
        code: initialData.code,
        status: getDeviceStatus(initialData),
      };

      if (pageConfig.showLinkedSlot) {
        nextValues.slotId = getSlotLabel(initialData.slotId);
      }

      form.setFieldsValue(nextValues);
      return;
    }
    form.resetFields();
  }, [open, mode, initialData, form, pageConfig.showLinkedSlot, getDeviceStatus]);

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
              ? t('iot.addEntity', { entity: pageConfig.entityName })
              : t('iot.editEntity', { entity: pageConfig.entityName })}
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
      okText={mode === 'add' ? t('common.add') : t('common.saveChanges')}
      cancelText={t('common.cancel')}
      destroyOnClose
      width={480}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label={t('iot.category')}>
          <Input value={pageConfig.entityName} disabled />
        </Form.Item>

        {mode === 'edit' && (
          <>
            <Form.Item name="_id" label={t('iot.deviceId')}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="code" label={t('iot.deviceCode')}>
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="status"
              label={t('common.status')}
              rules={[{ required: true, message: t('iot.pleaseSelectStatus') }]}
            >
              <Select placeholder={t('iot.pleaseSelectStatus')}>
                {DEVICE_STATUSES.map((status) => (
                  <Option key={status} value={status}>
                    {t(`common.${status.toLowerCase()}`)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {pageConfig.showLinkedSlot && (
              <Form.Item name="slotId" label={t('iot.slotCodeOptional')}>
                <Input placeholder={t('iot.enterSlotCode')} disabled />
              </Form.Item>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
};

const DeleteConfirmModal = ({ open, device, onClose, onDelete, confirmLoading, categoryName }) => {
  const { t } = useAdminI18n();
  if (!device) return null;

  return (
    <Modal
      title={
        <Space style={{ color: '#cf1322' }}>
          <ExclamationCircleOutlined />
          <span>{t('iot.deleteDevice')}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={() => onDelete(device.code)}
      confirmLoading={confirmLoading}
      okText={t('iot.yesDelete')}
      okButtonProps={{ danger: true }}
      cancelText={t('common.cancel')}
      width={440}
    >
      <p>
        {t('iot.confirmDeleteDevice', {
          code: device.code,
          category: categoryName || t('iot.thisCategory'),
        })}
      </p>
    </Modal>
  );
};

const DeviceManagementContent = ({ categoryCode, fallbackPath = '/admin/dashboard', pageConfig, apiConfig }) => {
  const { t } = useAdminI18n();
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

  const getDeviceStatus = pageConfig.getDeviceStatus || getStatus;
  const getDeviceCategoryCode = pageConfig.getDeviceCategoryCode || ((device) => device.categoryId?.code);
  const getSearchableText =
    pageConfig.getSearchableText ||
    ((device) => {
      const parts = [String(device.code || '')];
      if (pageConfig.showLinkedSlot) {
        parts.push(getSlotLabel(device.slotId));
      }
      return parts.join(' ').toLowerCase();
    });
  const buildCreatePayload =
    pageConfig.buildCreatePayload ||
    (() => ({
      code: '0',
      categoryCode,
    }));
  const buildUpdatePayload =
    pageConfig.buildUpdatePayload ||
    ((device, values) => ({
      _id: device._id,
      code: device.code,
      categoryCode,
      isOnline: values.status === 'Online',
      isActive: 1,
      ...(pageConfig.showLinkedSlot ? { slotId: values.slotId } : {}),
    }));

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.post(CATEGORY_IOT_API.GET_LIST, {});
      if (response?.success) {
        setCategories(response.data || []);
      } else {
        notification.error({
          message: t('iot.errorFetchingCategories'),
          description: response?.message || t('common.unknownError'),
        });
      }
    } catch (error) {
      notification.error({
        message: t('iot.errorFetchingCategories'),
        description: error.message,
      });
    } finally {
      setCategoriesLoaded(true);
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.post(apiConfig.GET_LIST, {});
      if (response?.success) {
        setDevices(response.data || []);
      } else {
        notification.error({
          message: t('iot.errorFetchingDevices'),
          description: response?.message || t('common.unknownError'),
        });
      }
    } catch (error) {
      notification.error({
        message: t('iot.errorFetchingDevices'),
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

  const categoryDevices = useMemo(
    () => devices.filter((device) => getDeviceCategoryCode(device) === categoryCode),
    [devices, categoryCode, getDeviceCategoryCode],
  );

  const filteredDevices = useMemo(
    () =>
      categoryDevices.filter((device) => {
        const normalizedKeyword = searchText.toLowerCase();
        const matchSearch = getSearchableText(device).includes(normalizedKeyword);
        const deviceStatus = getDeviceStatus(device);
        const matchStatus = statusFilter === 'All' || deviceStatus === statusFilter;
        return matchSearch && matchStatus;
      }),
    [categoryDevices, searchText, statusFilter, getSearchableText, getDeviceStatus],
  );

  const stats = useMemo(() => {
    let online = 0;
    let offline = 0;

    categoryDevices.forEach((device) => {
      const status = getDeviceStatus(device);
      if (status === 'Online') online += 1;
      else offline += 1;
    });

    return {
      total: categoryDevices.length,
      online,
      offline,
      unlinked: categoryDevices.filter((device) => !device.slotId).length,
    };
  }, [categoryDevices, getDeviceStatus]);

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
      const payload = formMode === 'add' ? buildCreatePayload(values) : buildUpdatePayload(editingDevice, values);
      const response = await axiosClient.post(apiConfig.UPDATE, payload);
      if (response?.success) {
        notification.success({
          message: formMode === 'add' ? t('iot.deviceAdded') : t('iot.deviceUpdated'),
          description: t('iot.changesSaved'),
        });
        setFormModalOpen(false);
        fetchDevices();
      } else {
        notification.error({
          message: t('iot.failedToSaveDevice'),
          description: response?.message || t('common.unknownError'),
        });
      }
    } catch (error) {
      notification.error({
        message: t('iot.actionFailed'),
        description: error.message,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDevice = async (code) => {
    setFormLoading(true);
    try {
      const response = await axiosClient.post(apiConfig.DELETE, { items: [code] });
      if (response?.success) {
        notification.success({
          message: t('iot.deviceDeleted'),
          description: t('iot.deviceRemovedSuccessfully'),
        });
        setDeleteModalOpen(false);
        fetchDevices();
      } else {
        notification.error({
          message: t('iot.failedToDeleteDevice'),
          description: response?.message || t('common.unknownError'),
        });
      }
    } catch (error) {
      notification.error({
        message: t('iot.deleteFailed'),
        description: error.message,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      title: t('iot.deviceCode'),
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
      render: (code) => <Text strong>{code}</Text>,
    },
    pageConfig.showLinkedSlot
      ? {
        title: t('iot.linkedSlot'),
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
      title: t('common.status'),
      key: 'status',
      filters: DEVICE_STATUSES.map((status) => ({
        text: t(`common.${status.toLowerCase()}`),
        value: status,
      })),
      onFilter: (value, record) => getDeviceStatus(record) === value,
      render: (_, record) => {
        const status = getDeviceStatus(record);
        const translatedStatusConfig = {
          Online: { color: 'success', icon: <WifiOutlined />, label: t('common.online') },
          Offline: { color: 'error', icon: <DisconnectOutlined />, label: t('common.offline') },
        };
        const config = translatedStatusConfig[status] || { color: 'default', label: status, icon: null };
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
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title={t('iot.editDevice')}>
            <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          </Tooltip>
          <Tooltip title={t('iot.deleteDevice')}>
            <Button
              type="text"
              danger
              disabled={getDeviceStatus(record) === 'Online'}
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
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {pageConfig.title}
          </Title>
          <Text type="secondary">
            {pageConfig.description}
          </Text>
        </div>
        <Space>
          <Button onClick={fetchDevices} loading={loading} icon={<ReloadOutlined />}>
            {t('common.refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} disabled={!selectedCategory}>
            {t('iot.addEntity', { entity: pageConfig.entityName })}
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{t('iot.totalDevices')}</div>
            <div style={{ fontSize: 22, fontWeight: 'bold' }}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#b7eb8f', background: '#f6ffed' }}>
            <div style={{ fontSize: 12, color: '#389e0d' }}>{t('common.online')}</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#52c41a' }}>{stats.online}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#ffa39e', background: '#fff1f0' }}>
            <div style={{ fontSize: 12, color: '#cf1322' }}>{t('common.offline')}</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#f5222d' }}>{stats.offline}</div>
          </Card>
        </Col>
        {pageConfig.showUnlinkedStat && (
          <Col xs={12} sm={6} md={4}>
            <Card size="small" style={{ textAlign: 'center', borderColor: '#91caff', background: '#e6f4ff' }}>
              <div style={{ fontSize: 12, color: '#0958d9' }}>{t('iot.unlinked')}</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1677ff' }}>{stats.unlinked}</div>
            </Card>
          </Col>
        )}
      </Row>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder={
            pageConfig.showLinkedSlot ? t('iot.searchByDeviceOrSlot') : t('iot.searchByDevice')
          }
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
          <Option value="All">{t('common.allStatus')}</Option>
          {DEVICE_STATUSES.map((status) => (
            <Option key={status} value={status}>
              {t(`common.${status.toLowerCase()}`)}
            </Option>
          ))}
        </Select>
        <Text type="secondary" style={{ lineHeight: '32px' }}>
          {t('iot.showingDevices', {
            filtered: filteredDevices.length,
            total: categoryDevices.length,
            entity: pageConfig.entityName.toLowerCase(),
          })}
        </Text>
      </Space>

      <div style={{ minHeight: '450px' }}>
        <Table
          columns={columns}
          dataSource={filteredDevices}
          rowKey={(record) => record._id || record.code}
          scroll={{ x: 900 }}
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            showTotal: (total) => t('iot.devicesCount', { total }),
          }}
          loading={loading}
          locale={{ emptyText: t('iot.noEntitiesFound', { entity: pageConfig.entityName.toLowerCase() }) }}
        />
      </div>

      <DeviceFormModal
        open={formModalOpen}
        mode={formMode}
        initialData={editingDevice}
        selectedCategory={selectedCategory}
        pageConfig={pageConfig}
        getDeviceStatus={getDeviceStatus}
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
        categoryName={getCategoryDisplayName(selectedCategory, pageConfig.entityName)}
      />
    </div>
  );
};

export default DeviceManagementContent;
