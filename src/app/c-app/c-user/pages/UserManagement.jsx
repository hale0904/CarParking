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
  Badge,
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
import { USER_API } from '../../../c-lib/api/user.api';
import { useAdminI18n } from '../../../c-lib/i18n/adminI18n';

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
  const { t } = useAdminI18n();
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
          message: t('users.failedToLoadUserList'),
          description: response?.message || t('users.unknownServerError'),
        });
      }
    } catch (error) {
      notification.error({
        message: t('users.failedToLoadUserList'),
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
        (user.phone && String(user.phone).includes(lowerSearch)) ||
        (user.vehicles && user.vehicles.some((v) => v.licensePlate && v.licensePlate.toLowerCase().includes(lowerSearch)))
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
      title: t('users.name') || 'Tên',
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
            <Text strong style={{ fontSize: 15 }}>{text || t('common.notAvailable')}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Thông tin liên hệ',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.phone ? (
            <Space size={8}>
              <PhoneOutlined style={{ color: '#8c8c8c' }} />
              <Text>{record.phone}</Text>
            </Space>
          ) : null}
          {record.email ? (
            <Space size={8}>
              <MailOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary">{record.email}</Text>
            </Space>
          ) : null}
          {!record.phone && !record.email && <Text type="secondary">{t('common.notAvailable')}</Text>}
        </Space>
      ),
    },
    {
      title: 'Biển số xe',
      key: 'licensePlates',
      render: (_, record) => (
        <Space wrap>
          {record.vehicles && record.vehicles.length > 0 ? (
            record.vehicles.map((v) => (
              <Tag key={v._id || v.licensePlate} color="blue" style={{ fontWeight: 500 }}>
                {v.licensePlate}
              </Tag>
            ))
          ) : (
            <Text type="secondary">-</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const isActive = record.status === undefined || record.status === 1 || record.status === 'Active';
        return (
          <Badge
            status={isActive ? 'success' : 'error'}
            text={
              <span style={{ color: isActive ? '#52c41a' : '#f5222d', fontWeight: 500 }}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            }
          />
        );
      },
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
              {t('users.title')}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {t('users.subtitle')}
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
            loading={loading}
            size="large"
            style={{ borderRadius: '6px' }}
          >
            {t('common.refresh')}
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#fafafa', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary">{t('users.totalUsers')}</Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#1677ff' }}>
                {stats.total}
              </Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#fffbe6', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary" style={{ color: '#d48806' }}>
                {t('users.admins')}
              </Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#d4b106' }}>
                {stats.admin}
              </Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#e6f4ff', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary" style={{ color: '#0958d9' }}>
                {t('users.users')}
              </Text>
              <Title level={2} style={{ margin: '8px 0 0 0', color: '#1677ff' }}>
                {stats.user}
              </Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ background: '#f6ffed', borderRadius: '8px' }} bodyStyle={{ padding: '16px' }}>
              <Text type="secondary" style={{ color: '#389e0d' }}>
                {t('users.newThisMonth')}
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
        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minHeight: '600px' }}
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
            placeholder={t('users.searchPlaceholder')}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 350, borderRadius: '6px' }}
            size="large"
            allowClear
          />
          <Text type="secondary" style={{ lineHeight: '40px' }}>
            {t('users.showingUsers', { filtered: filteredUsers.length, total: users.length })}
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey={(record) => record._id || record.code}
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
            showTotal: (total) => t('users.totalUsersPagination', { total }),
            style: { marginTop: 24 },
          }}
          locale={{ emptyText: t('users.noUsersFound') }}
          rowClassName="user-table-row"
          style={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}
        />
      </Card>

      <Drawer
        title={t('users.userDetails')}
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
                  {selectedUser.userName || t('common.notAvailable')}
                </Title>
                <Space wrap>
                  <Tag color={(selectedUser.role || 'user').toLowerCase() === 'admin' ? 'gold' : 'blue'}>
                    {selectedUser.role || 'user'}
                  </Tag>
                  <Tag color="processing">
                    {t('users.vehiclesCount', { count: (selectedUser.vehicles || []).length })}
                  </Tag>
                </Space>
              </Space>
            </Space>

            <Descriptions title={t('users.basicInformation')} bordered column={1} size="middle" labelStyle={{ width: 160 }}>
              <Descriptions.Item label={t('users.userCode')}>
                <Space size={8}>
                  <IdcardOutlined />
                  <span>{selectedUser.code || t('common.notAvailable')}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('users.fullName')}>
                <Space size={8}>
                  <UserOutlined />
                  <span>{selectedUser.userName || t('common.notAvailable')}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('users.email')}>
                <Space size={8}>
                  <MailOutlined />
                  <span>{selectedUser.email || t('common.notAvailable')}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('users.phoneNumber')}>
                <Space size={8}>
                  <PhoneOutlined />
                  <span>{formatPhoneNumber(selectedUser.phone)}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('users.joinedAt')}>
                <Space size={8}>
                  <CalendarOutlined />
                  <span>
                    {selectedUser.createdAt
                      ? dayjs(selectedUser.createdAt).format('DD/MM/YYYY HH:mm:ss')
                      : t('common.notAvailable')}
                  </span>
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: 0 }} />

            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                {t('users.vehicles')}
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
                            <Text strong>{vehicle.nameVehicles || vehicle.code || t('common.notAvailable')}</Text>
                          </Space>

                        </Space>
                        <Text type="secondary">{t('users.code')}: {vehicle.code || t('common.notAvailable')}</Text>
                        <Text>{t('users.licensePlate')}: {vehicle.licensePlate || t('common.notAvailable')}</Text>
                        <Text type="secondary">
                          {t('users.createdAt')}:{' '}
                          {vehicle.createdAt ? dayjs(vehicle.createdAt).format('DD/MM/YYYY HH:mm') : t('common.notAvailable')}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description={t('users.noVehicles')} />
              )}
            </div>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
};

export default UserManagement;
