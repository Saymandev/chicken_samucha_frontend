import { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';

export interface Notification {
  id: string;
  type: 'order' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
  priority: 'low' | 'medium' | 'high';
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await adminAPI.getNotifications();
      if (response?.data?.notifications) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      // Generate mock notifications for demo
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'order',
          title: 'New Order Received',
          message: 'Order #ORD646221008 needs confirmation',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
          orderId: 'ORD646221008',
          priority: 'high'
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Verification Required',
          message: 'bKash payment screenshot uploaded',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          read: false,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'order',
          title: 'Order Ready for Delivery',
          message: 'Order #ORD646221007 is ready to ship',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: true,
          priority: 'medium'
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
}; 