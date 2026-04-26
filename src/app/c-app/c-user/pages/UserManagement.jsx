import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Input,
  List,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  notification,
} from 'antd';
import {
  CalendarOutlined,
  CarOutlined,
  CrownOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axiosClient from '../../../c-lib/axios/axiosClient.service';
import { USER_API } from '../../../c-lib/constants/auth-api.constant';

const { Title, Text } = Typography;

const getVehicleStatusColor = (status) => {
  if (status === 1) return 'green';
  if (status === 0) return 'red';
  return 'default';
};

const formatPhoneNumber = (phone) => {
  if (phone === null || phone === undefined || phone === '') return 'N/A';
  return String(phone);
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.post(USER_API.GET_LIST, {});
      if (response?.success) {
        setUsers(response.data || []);
      } else {
        notification.error({
          message: 'Failed to load user list',
          description: response?.message || 'Unknown server error.',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Failed to load user list',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchText) return users;
    const lowerSearch = searchText.toLowerCase();
    return users.filter(
      (user) =>
        (user.userName && user.userName.toLowerCase().includes(lowerSearch)) ||
        (user.code && user.code.toLowerCase().includes(lowerSearch)) ||
        (user.email && user.email.toLowerCase().includes(lowerSearch)) ||
        (user.phone && String(user.phone).includes(lowerSearch)),
    );
  }, [users, searchText]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admin: users.filter((u) => u.role && u.role.toLowerCase() === 'admin').length,
      user: users.filter((u) => !u.role || u.role.toLowerCase() === 'user').length,
      newThisMonth: users.filter((u) => dayjs(u.createdAt).isAfter(dayjs().startOf('month')))
        .length,
    }),
    [users],
  );

  const columns = [
    {
      title: 'Name',
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
          <Text strong style={{ fontSize: 15 }}>{text || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'User', value: 'user' },
      ],
      onFilter: (value, record) => (record.role || 'user').toLowerCase() === value,
      render: (role) => {
        const normalizedRole = role || 'user';
        const isUser = normalizedRole.toLowerCase() === 'user';
        return (
          <Tag
            icon={isUser ? <UserOutlined /> : <CrownOutlined />}
            color={isUser ? 'blue' : 'gold'}
            style={{ padding: '4px 10px', borderRadius: '4px', textTransform: 'capitalize', fontWeight: 500 }}
          >
            {normalizedRole}
          </Tag>
        );
      },
    },
    {
      title: 'Joined At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
      render: (date) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <Text>{date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'N/A'}</Text>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0', background: '#f5f5f5', minHeight: '100%' }}>
      <div
        style={{
          marginBottom: 24,
          padding: '24px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
              User Management
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              View and manage user accounts in the system
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
            loading={loading}
            size="large"
            style={{ borderRadius: '6px' }}
          >
            Refresh
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#fafafa', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary">Total Users</Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#1677ff' }}>
                {stats.total}
              </Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#fffbe6', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary" style={{ color: '#d48806' }}>
                Admins
              </Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#d4b106' }}>
                {stats.admin}
              </Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#e6f4ff', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary" style={{ color: '#0958d9' }}>
                Users
              </Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#1677ff' }}>
                {stats.user}
              </Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#f6ffed', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary" style={{ color: '#389e0d' }}>
                New This Month
              </Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#52c41a' }}>
                {stats.newThisMonth}
              </Title>
            </Card>
          </Col>
        </Row>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        bodyStyle={{ padding: '24px' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 20,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Input
            placeholder="Search by name, code, email, or phone..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 350, borderRadius: '6px' }}
            size="large"
            allowClear
          />
          <Text type="secondary" style={{ lineHeight: '40px' }}>
            Showing <b>{filteredUsers.length}</b> / {users.length} users
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="_id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => {
              setSelectedUser(record);
              setDrawerOpen(true);
            },
            style: { cursor: 'pointer' },
          })}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
            style: { marginTop: 24 },
          }}
          locale={{ emptyText: 'No users found.' }}
          rowClassName="user-table-row"
          style={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}
        />
      </Card>

      <Drawer
        title="User Details"
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedUser ? (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Space size={16} align="start">
              <Avatar
                size={72}
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedUser.code || selectedUser._id}`}
                style={{ backgroundColor: '#f0f0f0', border: '1px solid #d9d9d9' }}
              />
              <Space direction="vertical" size={2}>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedUser.userName || 'N/A'}
                </Title>
                <Space wrap>
                  <Tag color={(selectedUser.role || 'user').toLowerCase() === 'admin' ? 'gold' : 'blue'}>
                    {selectedUser.role || 'user'}
                  </Tag>
                  <Tag color="processing">{(selectedUser.vehicles || []).length} vehicle(s)</Tag>
                </Space>
              </Space>
            </Space>

            <Descriptions title="Basic Information" bordered column={1} size="middle" labelStyle={{ width: 160 }}>
              <Descriptions.Item label="User Code">
                <Space size={8}>
                  <IdcardOutlined />
                  <span>{selectedUser.code || 'N/A'}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Full Name">
                <Space size={8}>
                  <UserOutlined />
                  <span>{selectedUser.userName || 'N/A'}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Space size={8}>
                  <MailOutlined />
                  <span>{selectedUser.email || 'N/A'}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Phone Number">
                <Space size={8}>
                  <PhoneOutlined />
                  <span>{formatPhoneNumber(selectedUser.phone)}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Joined At">
                <Space size={8}>
                  <CalendarOutlined />
                  <span>
                    {selectedUser.createdAt
                      ? dayjs(selectedUser.createdAt).format('DD/MM/YYYY HH:mm:ss')
                      : 'N/A'}
                  </span>
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: 0 }} />

            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                Vehicles
              </Title>
              {(selectedUser.vehicles || []).length > 0 ? (
                <List
                  dataSource={selectedUser.vehicles || []}
                  split
                  renderItem={(vehicle) => (
                    <List.Item>
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }} align="start">
                          <Space size={8}>
                            <CarOutlined style={{ color: '#1677ff' }} />
                            <Text strong>{vehicle.nameVehicles || vehicle.code || 'N/A'}</Text>
                          </Space>
                          <Tag color={getVehicleStatusColor(vehicle.status)}>
                            {vehicle.statusName || 'Unknown'}
                          </Tag>
                        </Space>
                        <Text type="secondary">Code: {vehicle.code || 'N/A'}</Text>
                        <Text>License Plate: {vehicle.licensePlate || 'N/A'}</Text>
                        <Text type="secondary">
                          Created At:{' '}
                          {vehicle.createdAt ? dayjs(vehicle.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="This user has no vehicles." />
              )}
            </div>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
};

export default UserManagement;
