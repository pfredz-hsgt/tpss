'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notificationApi, Notification } from '@/lib/api';
import { connectSocket } from '@/lib/websocket';
import { useAuth } from '@/lib/auth';
import {
  Badge, Button, Popover, List, Typography, Space,
  Avatar, Empty, Spin, theme
} from 'antd';
import {
  BellOutlined, CloseOutlined, CheckOutlined,
  InfoCircleOutlined, NotificationOutlined
} from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';

const { Text, Title } = Typography;
const { useToken } = theme;

export default function NotificationCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useToken();

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();

      // Connect socket
      const socket = connectSocket(user.id);

      socket.on('notification', () => {
        loadNotifications();
        loadUnreadCount();
      });

      // Poll for updates
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification.id);
        loadNotifications();
        loadUnreadCount();
      }

      // Handle navigation based on notification type
      if (notification.type === 'PASSOVER' && notification.relatedId) {
        router.push(`/home?tab=passover&passoverId=${notification.relatedId}`);
        setIsOpen(false);
      } else if (notification.type === 'ANNOUNCEMENT' && notification.relatedId) {
        router.push(`/home?tab=announcements&announcementId=${notification.relatedId}`);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const content = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        marginBottom: 8,
        borderBottom: `1px solid ${token.colorBorderSecondary}`
      }}>
        <Title level={5} style={{ margin: 0 }}>Notifications</Title>
        <Space>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              onClick={handleMarkAllAsRead}
              icon={<CheckOutlined />}
            >
              Mark all read
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setIsOpen(false)}
          />
        </Space>
      </div>

      {notifications.length === 0 ? (
        <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleNotificationClick(item)}
              style={{
                cursor: 'pointer',
                background: item.isRead ? 'transparent' : token.colorPrimaryBg,
                padding: '12px',
                borderRadius: token.borderRadius,
                marginBottom: 4,
                transition: 'background 0.3s'
              }}
              className="hover:bg-gray-50"
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={item.type === 'ANNOUNCEMENT' ? <NotificationOutlined /> : <InfoCircleOutlined />}
                    style={{ backgroundColor: item.isRead ? token.colorTextDisabled : token.colorPrimary }}
                  />
                }
                title={
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong={!item.isRead}>{item.title}</Text>
                    {!item.isRead && <Badge status="processing" />}
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{item.message}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottomRight"
      overlayInnerStyle={{ padding: 16 }}
    >
      <Badge count={unreadCount} overflowCount={9}>
        <Button
          shape="circle"
          icon={<BellOutlined />}
          size="large"
          type="text"
        />
      </Badge>
    </Popover>
  );
}
