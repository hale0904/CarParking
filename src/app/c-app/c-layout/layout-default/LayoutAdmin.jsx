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
  GlobalOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export const LanguageContext = React.createContext('en');

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

const AdminFooter = ({ collapsed, language, setLanguage }) => {
  const navigate = useNavigate();

  const items = [
    {
      key: 'language',
      label: language === 'en' ? 'Language: EN 🇬🇧' : 'Ngôn ngữ: VI 🇻🇳',
      icon: <GlobalOutlined />,
      onClick: () => setLanguage(language === 'en' ? 'vi' : 'en'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: language === 'en' ? 'Logout' : 'Đăng xuất',
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
                <span className="admin-role">{language === 'en' ? 'Super User' : 'Quản trị viên'}</span>
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
const MenuList = ({ language }) => {
  const menuLabels = {
    en: {
      manageMap: 'Manage Map',
      iotDevices: 'IoT Devices',
      barrierControl: 'Barrier Control',
      userManagement: 'User Management',
      dashboard: 'Dashboard & Reports',
    },
    vi: {
      manageMap: 'Quản lý bản đồ',
      iotDevices: 'Thiết bị IoT',
      barrierControl: 'Kiểm soát barrier',
      userManagement: 'Quản lý người dùng',
      dashboard: 'Bảng điều khiển & Báo cáo',
    },
  };

  const labels = menuLabels[language] || menuLabels.en;

  const items = [
    {
      key: 'map-manage',
      icon: <EnvironmentOutlined />,
      label: <Link to="/admin/parking-map">{labels.manageMap}</Link>,
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: <Link to="/admin/users">{labels.userManagement}</Link>,
    },
    {
      key: 'devices',
      icon: <ThunderboltOutlined />,
      label: <Link to="/admin/devices">{labels.iotDevices}</Link>,
    },
    {
      key: 'barrier',
      icon: <AlertOutlined />,
      label: <Link to="/admin/barrier-control">{labels.barrierControl}</Link>,
    },
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: <Link to="/admin/dashboard">{labels.dashboard}</Link>,
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
  const [language, setLanguage] = useState('en');
  const sidebarWidth = 260;

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
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
              <MenuList language={language} />
            </div>
            <AdminFooter collapsed={collapsed} language={language} setLanguage={setLanguage} />
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
    </LanguageContext.Provider>
  );
};

export default LayoutAdmin;
