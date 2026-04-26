import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
  notification,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import axiosClient from '../../../c-lib/axios/axiosClient.service';
import { CATEGORY_IOT_API } from '../../../c-lib/constants/auth-api.constant';
import { IotCategoryNavContext } from '../../c-layout/layout-default/LayoutAdmin';

const { Title, Text } = Typography;

const CategoryFormModal = ({ open, mode, initialValues, onCancel, onSubmit, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialValues) {
      form.setFieldsValue({
        code: initialValues.code,
        name: initialValues.name,
      });
      return;
    }
    form.resetFields();
  }, [open, mode, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (_) {
      // validation handled by antd form
    }
  };

  return (
    <Modal
      title={mode === 'edit' ? 'Update IoT Category' : 'Add IoT Category'}
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={handleOk}
      okText={mode === 'edit' ? 'Update' : 'Add'}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {mode === 'edit' && (
          <Form.Item name="code" label="Category Code">
            <Input disabled />
          </Form.Item>
        )}
        <Form.Item
          name="name"
          label="Category Name"
          rules={[{ required: true, message: 'Please enter a category name.' }]}
        >
          <Input placeholder="Enter category name" maxLength={100} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const IotCategoryManagement = () => {
  const { categories, refreshCategories, removeCategoryFromNav } = useContext(IotCategoryNavContext);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    await refreshCategories();
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const stats = useMemo(
    () => ({
      total: categories.length,
    }),
    [categories],
  );

  const handleAdd = () => {
    setModalMode('add');
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (category) => {
    setModalMode('edit');
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setFormLoading(true);
    try {
      const response = await axiosClient.post(CATEGORY_IOT_API.UPDATE, {
        code: modalMode === 'edit' ? editingCategory?.code : '0',
        name: values.name,
      });

      if (response?.success) {
        notification.success({
          message: modalMode === 'edit' ? 'Category updated' : 'Category added',
          description: 'The category has been saved successfully.',
        });
        setModalOpen(false);
        await refreshCategories({ highlightName: values.name });
      } else {
        notification.error({
          message: 'Failed to save category',
          description: response?.message || 'Unknown server error.',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Failed to save category',
        description: error.message,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (categoryCode) => {
    setFormLoading(true);
    removeCategoryFromNav(categoryCode);
    try {
      const response = await axiosClient.post(CATEGORY_IOT_API.DELETE, {
        items: [categoryCode],
      });
      if (response?.success) {
        notification.success({
          message: 'Category deleted',
          description: 'The category has been deleted successfully.',
        });
      } else {
        await refreshCategories();
        notification.error({
          message: 'Failed to delete category',
          description: response?.message || 'Unknown server error.',
        });
      }
    } catch (error) {
      await refreshCategories();
      notification.error({
        message: 'Failed to delete category',
        description: error.message,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      sorter: (a, b) => String(a.code || '').localeCompare(String(b.code || '')),
      render: (value) => <Text code>{value || 'N/A'}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
      render: (value) => (
        <Space size={10}>
          <TagsOutlined style={{ color: '#1677ff' }} />
          <Text strong>{value || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete IoT Category"
            description={`Delete "${record.name}"?`}
            onConfirm={() => handleDelete(record.code)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredCategories = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter(
      (category) =>
        String(category.code || '').toLowerCase().includes(keyword) ||
        String(category.name || '').toLowerCase().includes(keyword),
    );
  }, [categories, searchText]);

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
          <Title level={2} style={{ margin: 0 }}>
            IoT Category Management
          </Title>
          <Text type="secondary">
            Manage IoT categories used by sensors and cameras.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCategories} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Category
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Text type="secondary">Total Categories</Text>
        <Title level={3} style={{ margin: '8px 0 0', color: '#1677ff' }}>
          {stats.total}
        </Title>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="Search by code or name..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 320 }}
            allowClear
          />
          <Text type="secondary" style={{ lineHeight: '32px' }}>
            Showing {filteredCategories.length} of {categories.length} categories
          </Text>
        </div>
        <Table
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={filteredCategories}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
          }}
          locale={{ emptyText: 'No IoT categories found.' }}
        />
      </Card>

      <CategoryFormModal
        open={modalOpen}
        mode={modalMode}
        initialValues={editingCategory}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={formLoading}
      />
    </div>
  );
};

export default IotCategoryManagement;
