'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Layout, Menu, Button, Typography, Drawer } from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  HistoryOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  PhoneOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title } = Typography;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAdmin, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { key: '/home', icon: <HomeOutlined />, label: 'Home' },
    { key: '/create', icon: <PlusOutlined />, label: 'Post New' },
    { key: '/archive', icon: <HistoryOutlined />, label: 'Past Archive' },
    {
      type: 'group',
      label: 'Temperature Monitoring',
      children: [
        { key: '/temperature-reporting', icon: <ExperimentOutlined />, label: 'Temperature Reporting' },
        { key: '/pic-contacts', icon: <PhoneOutlined />, label: 'PIC Contact Number' },
        { key: '/view-reports', icon: <FileTextOutlined />, label: 'View Report' },
        ...(isAdmin ? [{ key: '/manage-fridges', icon: <AppstoreOutlined />, label: 'Manage Fridge' }] : [])
      ]
    },
    ...(isAdmin ? [{ key: '/admin', icon: <SettingOutlined />, label: 'Admin' }] : []),
    { type: 'divider' },
    { key: '/profile', icon: <UserOutlined />, label: user?.fullName || 'User Profile' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
    } else {
      router.push(key);
      setMobileVisible(false);
    }
  };

  const SidebarContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)' }}>
        <Title level={4} style={{ color: 'white', margin: 0, fontSize: collapsed ? '14px' : '20px' }}>
          {collapsed ? 'TP' : 'The Passover'}
        </Title>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ flex: 1, borderRight: 0 }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          type="primary"
          icon={<MenuOutlined />}
          onClick={() => setMobileVisible(true)}
          style={{ position: 'fixed', top: 16, left: 16, zIndex: 1000 }}
        />
        <Drawer
          placement="left"
          onClose={() => setMobileVisible(false)}
          open={mobileVisible}
          styles={{ body: { padding: 0, background: '#001529' } }}
          width={250}
        >
          {SidebarContent}
        </Drawer>
      </>
    );
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {SidebarContent}
    </Sider>
  );
}
