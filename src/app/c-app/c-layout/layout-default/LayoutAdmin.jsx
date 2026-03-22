import React, { useState } from 'react';
import './layoutAdmin.scss';
import { Layout, Menu, Button, Dropdown } from 'antd';
import {
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UpOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

/* ---------- Components ---------- */

const Logo = ({ collapsed, toggleCollapsed }) => (
  <div className={`logo-section ${collapsed ? 'collapsed' : ''}`}>
    <div className="logo-brand">
      <span className="logo-text">Smart Parking</span>
    </div>
    <Button
      type="text"
      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      onClick={toggleCollapsed}
      className="trigger-btn"
    />
  </div>
);

const AdminFooter = ({ collapsed }) => {
  const navigate = useNavigate();

  const items = [
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => navigate('/'),
    },
  ];

  return (
    <div className={`admin-footer ${collapsed ? 'collapsed' : ''}`}>
      <Dropdown menu={{ items }} placement="topLeft" trigger={['click']}>
        <div className="footer-content">
          <div className="admin-avatar">
            <UserOutlined />
            <div className="status-dot-notification" />
          </div>
          {!collapsed && (
            <>
              <div className="admin-info">
                <span className="admin-name">Admin</span>
                <span className="admin-role">Super User</span>
              </div>
              <UpOutlined className="dropdown-arrow" />
            </>
          )}
        </div>
      </Dropdown>
    </div>
  );
};

/* ---------- Sidebar Menu ---------- */
const MenuList = () => {
  const items = [
    {
      key: 'map-manage',
      icon: <EnvironmentOutlined />,
      label: <Link to="/admin/parking-map">Manage Map</Link>,
    },
    {
      key: 'devices',
      icon: <ThunderboltOutlined />,
      label: <Link to="/admin/devices">IoT Devices</Link>,
    },
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: <Link to="/admin/dashboard">Dashboard & Reports</Link>,
    },
    {
      key: 'barrier',
      icon: <AlertOutlined />,
      label: <Link to="/admin/barrier-control">Barrier Control</Link>,
    },
  ];

  return (
    <Menu
      theme="light"
      mode="inline"
      className="menu-bar"
      defaultSelectedKeys={['monitor']}
      items={items}
    />
  );
};

/* ---------- Main Layout ---------- */
const LayoutAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = 260;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={sidebarWidth}
        collapsedWidth={80}
        collapsible
        trigger={null}
        collapsed={collapsed}
        className="modern-sidebar"
        theme="light"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div className="sidebar-inner">
          <Logo collapsed={collapsed} toggleCollapsed={() => setCollapsed(!collapsed)} />
          <div className="scrollable-menu">
            <MenuList />
          </div>
          <AdminFooter collapsed={collapsed} />
        </div>
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : sidebarWidth,
          minHeight: '100vh',
          transition: 'margin-left 0.2s',
          background: '#F3F4F6' // Main content background
        }}
      >
        {/* Minimal Header if needed, otherwise just content area spacing */}
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: '#fff',
            borderRadius: 12, // Modern rounded corners for content card
            minHeight: 280,
            overflow: 'initial',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutAdmin;
