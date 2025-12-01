'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { notificationApi, Notification } from '@/lib/api';
import { connectSocket, getSocket } from '@/lib/websocket';
import { useAuth } from '@/lib/auth';

export default function NotificationCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      
      // Connect socket
      const socket = connectSocket(user.id);
      
      socket.on('notification', (data: any) => {
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
        // Navigate to home page with passover tab and scroll to the specific passover
        router.push(`/home?tab=passover&passoverId=${notification.relatedId}`);
        setIsOpen(false);
      } else if (notification.type === 'ANNOUNCEMENT' && notification.relatedId) {
        // Navigate to home page with announcements tab
        router.push(`/home?tab=announcements&announcementId=${notification.relatedId}`);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  };
  
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-700 hover:text-indigo-600 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-cyan-50">
            <h3 className="font-bold text-slate-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 ${
                      !notification.isRead ? 'bg-indigo-50/50 border-l-indigo-500' : 'border-l-transparent'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="ml-2 h-2.5 w-2.5 bg-indigo-500 rounded-full shadow-md"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

