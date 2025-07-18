import { useCallback, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { authAPI } from '../utils/api';

export interface UserNotification {
  id: string;
  type: 'order' | 'system' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

export const useUserNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await authAPI.getUserNotifications();
      if (response?.data?.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching user notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await authAPI.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await authAPI.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Socket.IO setup for real-time notifications
  useEffect(() => {
    if (!userId) return;

    const API_BASE_URL = process.env.API_URL || 'https://chicken-samucha-backend.onrender.com/api';
    const socketURL = API_BASE_URL.replace('/api', '');
    
    const newSocket = io(socketURL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification socket');
      // Join user-specific room for notifications
      newSocket.emit('join-user-room', userId);
    });

    // Listen for new notifications
    newSocket.on('new-user-notification', (notification: UserNotification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for order status updates
    newSocket.on('order-status-updated', (data: any) => {
      const notification: UserNotification = {
        id: `order-${Date.now()}`,
        type: 'order',
        title: 'Order Status Updated',
        message: `Your order ${data.orderNumber} is now ${data.newStatus.replace('_', ' ')}`,
        read: false,
        timestamp: new Date()
      };
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
}; 