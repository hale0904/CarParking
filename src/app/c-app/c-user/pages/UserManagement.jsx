import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Table, Typography, Space, Input, Tag, Button, 
  notification, Row, Col, Avatar, Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  IdcardOutlined,
  CrownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '../../../c-lib/axios/axiosClient.service';
import { USER_API } from '../../../c-lib/constants/auth-api.constant';

const { Title, Text } = Typography;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.post(USER_API.GET_LIST, {});
      if (response && response.success) {
        setUsers(response.data || []);
      } else {
        notification.error({
          message: 'Lỗi tải danh sách người dùng',
          description: response?.message || 'Lỗi không xác định từ máy chủ.'
        });
      }
    } catch (error) {
      notification.error({
        message: 'Lỗi tải danh sách người dùng',
        description: error.message
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchText) return users;
    const lowerSearch = searchText.toLowerCase();
    return users.filter(user => 
      (user.userName && user.userName.toLowerCase().includes(lowerSearch)) ||
      (user.code && user.code.toLowerCase().includes(lowerSearch)) ||
      (user.email && user.email.toLowerCase().includes(lowerSearch)) ||
      (user.phone && String(user.phone).includes(lowerSearch))
    );
  }, [users, searchText]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter(u => u.role && u.role.toLowerCase() === 'admin').length,
      user: users.filter(u => u.role && u.role.toLowerCase() === 'user').length,
      newThisMonth: users.filter(u => dayjs(u.createdAt).isAfter(dayjs().startOf('month'))).length
    };
  }, [users]);

  const columns = [
    {
      title: 'Tài khoản',
      dataIndex: 'userName',
      key: 'userName',
      sorter: (a, b) => String(a.userName || '').localeCompare(String(b.userName || '')),
      render: (text, record) => (
        <Space size={12}>
          <Avatar 
            size={40} 
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${record.code || record._id}`} 
            style={{ backgroundColor: '#f0f0f0', border: '1px solid #d9d9d9' }}
          />
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 15 }}>{text || 'N/A'}</Text>
            <Space size={4}>
              <IdcardOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text>
            </Space>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Thông tin liên hệ',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size={6}>
            <MailOutlined style={{ color: '#1677ff', fontSize: 13 }} />
            <Text>{record.email || <Text type="secondary">Chưa cập nhật</Text>}</Text>
          </Space>
          <Space size={6}>
            <PhoneOutlined style={{ color: '#52c41a', fontSize: 13 }} />
            <Text>{record.phone ? `0${record.phone}` : <Text type="secondary">Chưa cập nhật</Text>}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'User', value: 'user' },
      ],
      onFilter: (value, record) => (record.role || '').toLowerCase() === value,
      render: (role) => {
        const isUser = (role || '').toLowerCase() === 'user';
        return (
          <Tag 
            icon={isUser ? <UserOutlined /> : <CrownOutlined />} 
            color={isUser ? 'blue' : 'gold'}
            style={{ padding: '4px 10px', borderRadius: '4px', textTransform: 'capitalize', fontWeight: 500 }}
          >
            {role || 'N/A'}
          </Tag>
        );
      }
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      render: (date) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <Text>{date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'N/A'}</Text>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '0', background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header Area */}
      <div style={{ marginBottom: 24, padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 600 }}>Quản lý Người dùng</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Xem và quản lý thông tin tài khoản người dùng trong hệ thống
            </Text>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchUsers} 
            loading={loading}
            size="large"
            style={{ borderRadius: '6px' }}
          >
            Làm mới
          </Button>
        </div>

        {/* Stats Row */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#fafafa', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary">Tổng người dùng</Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#1677ff' }}>{stats.total}</Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#fffbe6', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary" style={{ color: '#d48806' }}>Quản trị viên (Admin)</Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#d4b106' }}>{stats.admin}</Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#e6f4ff', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary" style={{ color: '#0958d9' }}>Khách hàng (User)</Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#1677ff' }}>{stats.user}</Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#f6ffed', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary" style={{ color: '#389e0d' }}>Mới trong tháng</Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#52c41a' }}>{stats.newThisMonth}</Title>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Table Area */}
      <Card 
        bordered={false} 
        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Input
            placeholder="Tìm kiếm theo Tên, Code, Email hoặc SĐT..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 350, borderRadius: '6px' }}
            size="large"
            allowClear
          />
          <Text type="secondary" style={{ lineHeight: '40px' }}>
            Đang hiển thị <b>{filteredUsers.length}</b> / {users.length} tài khoản
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="_id"
          loading={loading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            showTotal: total => `Tổng số ${total} tài khoản`,
            style: { marginTop: 24 }
          }}
          locale={{ emptyText: 'Không tìm thấy người dùng nào.' }}
          rowClassName="user-table-row"
          style={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}
        />
      </Card>
    </div>
  );
};

export default UserManagement;
