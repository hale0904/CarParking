import React, { useContext, useEffect, useMemo, useState } from 'react';
import './layoutAdmin.scss';
import { Layout, Menu, Button, Dropdown, notification } from 'antd';
import {
  // AlertOutlined,
  BarChartOutlined,
  DollarOutlined,
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
import { CATEGORY_IOT_API } from '../../../c-lib/api/iot.api';
import { LANGUAGE_STORAGE_KEY, LanguageContext, useAdminI18n } from '../../../c-lib/i18n/adminI18n';
import AuthHelper from '../../../c-lib/auth/auth.helper';

export const IotCategoryNavContext = React.createContext({
  categories: [],
  refreshCategories: async () => [],
  setHighlightCategoryCode: () => {},
});

const { Sider, Content } = Layout;

const Logo = ({ collapsed, toggleCollapsed }) => {
  const { t } = useAdminI18n();

  return (
    <div className={`logo-section ${collapsed ? 'collapsed' : ''}`}>
      <div className="logo-brand">
        <span className="logo-text">{t('common.appName')}</span>
      </div>
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={toggleCollapsed}
        className="trigger-btn"
      />
    </div>
  );
};

const AdminFooter = ({ collapsed }) => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useAdminI18n();

  const items = [
    {
      key: 'language',
      label: t('layout.language'),
      icon: <GlobalOutlined />,
      onClick: () => setLanguage(language === 'en' ? 'vi' : 'en'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: t('common.logout'),
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        AuthHelper.clearTokens();
        notification.success({
          message: language === 'vi' ? 'Đăng xuất thành công' : 'Logout Successful',
          description:
            language === 'vi'
              ? 'Bạn đã đăng xuất khỏi hệ thống.'
              : 'You have been logged out of the system.',
          placement: 'topRight',
        });
        navigate('/login');
      },
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
                <span className="admin-name">{t('common.admin')}</span>
                <span className="admin-role">{t('common.superUser')}</span>
              </div>
              <UpOutlined className="dropdown-arrow" />
            </>
          )}
        </div>
      </Dropdown>
    </div>
  );
};

const MenuList = () => {
  const location = useLocation();
  const { highlightCategoryCode } = useContext(IotCategoryNavContext);
  const { t } = useAdminI18n();

  const categoryMenuItems = useMemo(
    () => [
      {
        key: 'iot-sensors',
        className:
          highlightCategoryCode === 'CA001'
            ? 'iot-category-menu-item iot-category-menu-item--new'
            : 'iot-category-menu-item',
        label: <Link to="/admin/iot-sensors">{t('layout.sensors')}</Link>,
      },
      {
        key: 'iot-cameras',
        className:
          highlightCategoryCode === 'CA002'
            ? 'iot-category-menu-item iot-category-menu-item--new'
            : 'iot-category-menu-item',
        label: <Link to="/admin/iot-cameras">{t('layout.cameras')}</Link>,
      },
    ],
    [highlightCategoryCode, t],
  );

  const items = [
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: <Link to="/admin/dashboard">{t('layout.dashboard')}</Link>,
    },
    {
      key: 'map-manage',
      icon: <EnvironmentOutlined />,
      label: <Link to="/admin/parking-map">{t('layout.manageMap')}</Link>,
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: <Link to="/admin/users">{t('layout.userManagement')}</Link>,
    },
    {
      key: 'iot-management',
      icon: <ThunderboltOutlined />,
      label: t('layout.iotDeviceManagement'),
      children: categoryMenuItems,
    },
    // {
    //   key: 'barrier',
    //   icon: <AlertOutlined />,
    //   label: <Link to="/admin/barrier-control">{t('layout.barrierControl')}</Link>,
    // },
    {
      key: 'payment',
      icon: <DollarOutlined />,
      label: <Link to="/admin/payment">{t('layout.payment')}</Link>,
    },
  ];

  const selectedKey = useMemo(() => {
    if (location.pathname.includes('/admin/iot-sensors')) return 'iot-sensors';
    if (location.pathname.includes('/admin/iot-cameras')) return 'iot-cameras';
    if (location.pathname.includes('/admin/users')) return 'users';
    // if (location.pathname.includes('/admin/barrier-control')) return 'barrier';
    if (location.pathname.includes('/admin/dashboard')) return 'dashboard';
    if (location.pathname.includes('/admin/payment')) return 'payment';
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
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
  });
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
          const matchedCategory = nextCategories.find(
            (category) => category.name === highlightName,
          );
          if (matchedCategory?.code) {
            setHighlightCategoryCode(matchedCategory.code);
          }
        }

        return nextCategories;
      }
    } catch (error) {
      notification.error({
        message: language === 'vi' ? 'Khong the tai danh muc IoT' : 'Failed to load IoT categories',
        description: error.message,
      });
    }

    return [];
  };

  useEffect(() => {
    refreshCategories();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

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
