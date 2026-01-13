
// import { Outlet } from 'react-router-dom';

// function layoutDefault() {
//   return (
//   <div className="dashboard-layout">
//     <aside className="sidebar">SIDEBAR</aside>

//     <main className="content">
//       <header className="header">HEADER</header>

//       <section className="page">
//         <Outlet /> {/* PAGE CON */}
//       </section>
//     </main>
//   </div>
//   )
// }

// console.log('pageLayout', layoutDefault);

// export default layoutDefault;

import React, { useState } from "react";
import "./layoutAdmin.scss";
import { Layout, Menu, Button, theme } from "antd";
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
} from "@ant-design/icons";

import { FaMoon, FaSun } from "react-icons/fa";
import { Link, Outlet } from "react-router-dom";

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
    theme={darkTheme ? "dark" : "light"}
    mode="inline"
    className="menu-bar"
    items={[
      {
        key: "dashboard",
        icon: <DashboardOutlined />,
        label: <Link to="/admin">Dashboard</Link>,
        children: [
          {
            key: "dashboard-cars",
            icon: <CarOutlined />,
            label: <Link to="/admin/dashboard/cars">Số lượng xe</Link>,
          },
          {
            key: "dashboard-parking",
            icon: <FundOutlined />,
            label: <Link to="/admin/dashboard/parking">Tình trạng bãi đỗ</Link>,
          },
          {
            key: "dashboard-alerts",
            icon: <WarningOutlined />,
            label: (
              <Link to="/admin/dashboard/iot-alerts">
                Cảnh báo thiết bị IoT
              </Link>
            ),
          },
        ],
      },
      {
        key: "cars",
        icon: <CarOutlined />,
        label: <Link to="/admin/cars">Quản lý xe</Link>,
      },
      {
        key: "maps",
        icon: <EnvironmentOutlined />,
        label: <Link to="/admin/maps">Quản lý map</Link>,
      },
      {
        key: "users",
        icon: <UserOutlined />,
        label: <Link to="/admin/users">Quản lý user</Link>,
      },
      {
        key: "statistics",
        icon: <BarChartOutlined />,
        label: <Link to="/admin/statistics">Thống kê</Link>,
      },
    ]}
  />
);


/* ---------- Theme Toggle ---------- */
const ToggleThemeButton = ({ darkTheme, toggleTheme }) => (
  <div className="toggle-theme-btn">
    <Button onClick={toggleTheme}>
      {darkTheme ? <FaSun /> : <FaMoon />}
    </Button>
  </div>
);

/* ---------- Main Layout ---------- */
const LayoutAdmin = () => {
  const [darkTheme, setDarkTheme] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ height: "100vh" }}>
      {/* Sidebar */}
      <Sider
        collapsed={collapsed}
        collapsible
        trigger={null}
        theme={darkTheme ? "dark" : "light"}
        className="sidebar"
        style={{
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <Logo />
        <MenuList darkTheme={darkTheme} />
        <ToggleThemeButton
          darkTheme={darkTheme}
          toggleTheme={() => setDarkTheme(!darkTheme)}
        />
      </Sider>

      {/* Main */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        {/* Header */}
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            position: "fixed",
            top: 0,
            right: 0,
            left: collapsed ? 80 : 200,
            zIndex: 1000,
            transition: "left 0.2s",
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
            margin: "16px",
            marginTop: 80,
            padding: 24,
            background: "#f0f2f5",
            minHeight: "calc(100vh - 96px)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutAdmin;