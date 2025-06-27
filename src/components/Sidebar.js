import React from "react";
import { Layout, Menu } from "antd";
import { Link } from "react-router-dom";
import { 
  PieChartOutlined, 
  UserOutlined, 
  DownloadOutlined, 
  LogoutOutlined 
} from "@ant-design/icons";

const { Sider } = Layout;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Sidebar = () => {

  const handleLogout = async () => {
    try {
      // Clear client storage first
      localStorage.clear();
      sessionStorage.clear();

      // Call logout endpoint
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      });

      // Clear cookies
      document.cookie.split(";").forEach((cookie) => {
        const [name] = cookie.split("=");
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });

      // Redirect with full page reload
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  return (
    <Sider collapsible breakpoint="lg" collapsedWidth="0">
      <div className="logo" />
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={["1"]}
        style={{ height: "100%", borderRight: 0 }}
      >
        <Menu.Item key="dashboard" icon={<PieChartOutlined />}>
          <Link to="/">Dashboard</Link>
        </Menu.Item>
        <Menu.Item key="expenses" icon={<PieChartOutlined />}>
          <Link to="/expenses">Expenses</Link>
        </Menu.Item>
       
        <Menu.Item key="admins" icon={<UserOutlined />}>
        <Link to="/admindashboard">Admin Dashboard</Link> {/* Fixed spelling */}
        </Menu.Item>
        <Menu.Item key="export" icon={<DownloadOutlined />}>
          <Link to="/export">Export Data</Link>
        </Menu.Item>
        <Menu.Item 
          key="logout" 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          style={{ marginTop: "auto" }}
        >
          Log Out
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;
