import React, { useContext, useEffect, useMemo, useState } from 'react';
import './layoutAdmin.scss';
import { Layout, Menu, Button, Dropdown, notification } from 'antd';
import {
  AlertOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UpOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../../../c-lib/axios/axiosClient.service';
import { CATEGORY_IOT_API } from '../../../c-lib/constants/auth-api.constant';

export const LanguageContext = React.createContext('en');
export const IotCategoryNavContext = React.createContext({
  categories: [],
  refreshCategories: async () => [],
  setHighlightCategoryCode: () => {},
  removeCategoryFromNav: () => {},
});

const { Sider, Content } = Layout;

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
      label: language === 'en' ? 'Language: EN' : 'Ngon ngu: VI',
      icon: <GlobalOutlined />,
      onClick: () => setLanguage(language === 'en' ? 'vi' : 'en'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: language === 'en' ? 'Logout' : 'Dang xuat',
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
                <span className="admin-role">
                  {language === 'en' ? 'Super User' : 'Quan tri vien'}
                </span>
              </div>
              <UpOutlined className="dropdown-arrow" />
            </>
          )}
        </div>
      </Dropdown>
    </div>
  );
};

const MenuList = ({ language }) => {
  const location = useLocation();
  const { categories, highlightCategoryCode } = useContext(IotCategoryNavContext);

  const menuLabels = {
    en: {
      manageMap: 'Manage Map',
      iotCategoryManagement: 'IoT Category Management',
      iotCategories: 'Manage Categories',
      barrierControl: 'Barrier Control',
      userManagement: 'User Management',
      dashboard: 'Dashboard & Reports',
    },
    vi: {
      manageMap: 'Quan ly ban do',
      iotCategoryManagement: 'Quan ly danh muc IoT',
      iotCategories: 'Quan ly danh muc',
      barrierControl: 'Kiem soat barrier',
      userManagement: 'Quan ly nguoi dung',
      dashboard: 'Bang dieu khien va bao cao',
    },
  };

  const labels = menuLabels[language] || menuLabels.en;

  const categoryMenuItems = useMemo(
    () =>
      categories.map((category) => ({
        key: `iot-device-${category.code}`,
        className:
          highlightCategoryCode === category.code ? 'iot-category-menu-item iot-category-menu-item--new' : 'iot-category-menu-item',
        label: <Link to={`/admin/iot-devices/${category.code}`}>{category.name || category.code}</Link>,
      })),
    [categories, highlightCategoryCode],
  );

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
      key: 'iot-management',
      icon: <ThunderboltOutlined />,
      label: labels.iotCategoryManagement,
      children: [
        {
          key: 'iot-categories',
          label: <Link to="/admin/iot-categories">{labels.iotCategories}</Link>,
        },
        ...categoryMenuItems,
      ],
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

  const selectedKey = useMemo(() => {
    if (location.pathname.includes('/admin/iot-categories')) return 'iot-categories';
    if (location.pathname.includes('/admin/iot-devices/')) {
      const code = location.pathname.split('/admin/iot-devices/')[1];
      return code ? `iot-device-${code}` : '';
    }
    if (location.pathname.includes('/admin/users')) return 'users';
    if (location.pathname.includes('/admin/barrier-control')) return 'barrier';
    if (location.pathname.includes('/admin/dashboard')) return 'dashboard';
    if (location.pathname.includes('/admin/parking-map')) return 'map-manage';
    return '';
  }, [location.pathname]);

  return (
    <Menu
      theme="light"
      mode="inline"
      className="menu-bar"
      selectedKeys={selectedKey ? [selectedKey] : []}
      defaultOpenKeys={['iot-management']}
      items={items}
    />
  );
};

const LayoutAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [language, setLanguage] = useState('en');
  const [categories, setCategories] = useState([]);
  const [highlightCategoryCode, setHighlightCategoryCode] = useState(null);
  const sidebarWidth = 260;

  const refreshCategories = async ({ highlightName } = {}) => {
    try {
      const response = await axiosClient.post(CATEGORY_IOT_API.GET_LIST, {});
      if (response?.success) {
        const nextCategories = response.data || [];
        setCategories(nextCategories);

        if (highlightName) {
          const matchedCategory = nextCategories.find((category) => category.name === highlightName);
          if (matchedCategory?.code) {
            setHighlightCategoryCode(matchedCategory.code);
          }
        }

        return nextCategories;
      }
    } catch (error) {
      notification.error({
        message: 'Failed to load IoT categories',
        description: error.message,
      });
    }

    return [];
  };

  useEffect(() => {
    refreshCategories();
  }, []);

  useEffect(() => {
    if (!highlightCategoryCode) return undefined;
    const timeoutId = window.setTimeout(() => {
      setHighlightCategoryCode(null);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [highlightCategoryCode]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <IotCategoryNavContext.Provider
        value={{
          categories,
          highlightCategoryCode,
          refreshCategories,
          setHighlightCategoryCode,
          removeCategoryFromNav: (categoryCode) => {
            setCategories((prev) => prev.filter((category) => category.code !== categoryCode));
            setHighlightCategoryCode((prev) => (prev === categoryCode ? null : prev));
          },
        }}
      >
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
              background: '#F3F4F6',
            }}
          >
            <Content
              style={{
                margin: '24px',
                padding: 24,
                background: '#fff',
                borderRadius: 12,
                minHeight: 280,
                overflow: 'initial',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              }}
            >
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </IotCategoryNavContext.Provider>
    </LanguageContext.Provider>
  );
};

export default LayoutAdmin;
