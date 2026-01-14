import React, { useState } from 'react';
import './layoutAdmin.scss';
import { Layout, Menu, Button, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FireFilled,
  DashboardOutlined,
  CarOutlined,
  FundOutlined,
  WarningOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BarChartOutlined,
  ProfileOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

import { FaMoon, FaSun } from 'react-icons/fa';
import { Link, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

/* ---------- Logo ---------- */
const Logo = () => (
  <div className="logo">
    <div className="logo-icon">
      <FireFilled />
    </div>
  </div>
);

/* ---------- Sidebar Menu ---------- */
const MenuList = ({ darkTheme }) => (
  <Menu
    theme={darkTheme ? 'dark' : 'light'}
    mode="inline"
    className="menu-bar"
    items={[
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: <Link to="/admin">Dashboard</Link>,
        children: [
          {
            key: 'dashboard-cars',
            icon: <CarOutlined />,
            label: <Link to="/admin/dashboard/cars">Số lượng xe</Link>,
          },
          {
            key: 'dashboard-parking',
            icon: <FundOutlined />,
            label: <Link to="/admin/dashboard/parking">Tình trạng bãi đỗ</Link>,
          },
          {
            key: 'dashboard-alerts',
            icon: <WarningOutlined />,
            label: <Link to="/admin/dashboard/iot-alerts">Cảnh báo thiết bị IoT</Link>,
          },
        ],
      },
      {
        key: 'cars',
        icon: <CarOutlined />,
        label: <Link to="/admin/cars">Quản lý xe</Link>,
      },
      {
        key: 'maps',
        icon: <EnvironmentOutlined />,
        label: <Link to="/admin/carparking-management">Quản lý map</Link>,
      },
      {
        key: 'users',
        icon: <UserOutlined />,
        label: <Link to="/admin/users">Quản lý user</Link>,
      },
      {
        key: 'statistics',
        icon: <BarChartOutlined />,
        label: <Link to="/admin/statistics">Thống kê</Link>,
      },
    ]}
  />
);

/* ---------- Theme Toggle ---------- */
const ToggleThemeButton = ({ darkTheme, toggleTheme }) => (
  <div className="toggle-theme-btn">
    <Button onClick={toggleTheme}>{darkTheme ? <FaSun /> : <FaMoon />}</Button>
  </div>
);

const AdminProfile = () => {
  return (
    <div className="admin-profile">
      <div className="admin-avatar">
        <UserOutlined />
        <span className="admin-name">Admin</span>
      </div>

      <div className="admin-dropdown">
        <div className="dropdown-item">
          <ProfileOutlined />
          <span>Thông tin tài khoản</span>
        </div>
        <div className="dropdown-divider" />
        <div className="dropdown-item logout">
          <LogoutOutlined />
          <span>Đăng xuất</span>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main Layout ---------- */
const LayoutAdmin = () => {
  const [darkTheme, setDarkTheme] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Sidebar */}
      <Sider
        collapsed={collapsed}
        collapsible
        trigger={null}
        theme={darkTheme ? 'dark' : 'light'}
        className="sidebar"
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <Logo />
        <MenuList darkTheme={darkTheme} />
        <ToggleThemeButton darkTheme={darkTheme} toggleTheme={() => setDarkTheme(!darkTheme)} />
      </Sider>

      {/* Main */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            height: 64,
            flexShrink: 0, // 🔒 không cho co
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          />
        </Header>

        {/* Content */}
        <Content
          style={{
            flex: 1, // 🔥 chiếm phần còn lại
            overflow: 'auto', // 🔥 CHỈ CHỖ NÀY SCROLL
            margin: 16,
            padding: 24,
            background: '#f0f2f5',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutAdmin;
