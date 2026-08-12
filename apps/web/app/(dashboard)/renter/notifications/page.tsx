'use client';

import { useState, useEffect } from 'react';
import { NotificationsHeader } from '@/components/renter/notifications/NotificationsHeader';
import { NotificationsStats } from '@/components/renter/notifications/NotificationsStats';
import { NotificationsList } from '@/components/renter/notifications/NotificationsList';
import { NotificationFilters } from '@/components/renter/notifications/NotificationFilters';
import { NotificationPreferences } from '@/components/renter/notifications/NotificationPreferences';
import { NotificationAnalytics } from '@/components/renter/notifications/NotificationAnalytics';
import { DoNotDisturb } from '@/components/renter/notifications/DoNotDisturb';
import { NotificationSearch } from '@/components/renter/notifications/NotificationSearch';
import { NotificationSound } from '@/components/renter/notifications/NotificationSound';
import { Notification } from '@/types/notification';
import { renterService } from '@/services/renterService';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadNotifications = async () => {
      const res = await renterService.listNotifications();
      if (res.success && res.data) setNotifications(res.data);
    };
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const res = await renterService.markNotificationAsRead(id);
    if (res.success && res.data) {
      const updated = res.data;
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    }
  };

  const handleMarkAllAsRead = async () => {
    const res = await renterService.markAllNotificationsAsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await renterService.deleteNotification(id);
    if (res.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleClearAll = async () => {
    const res = await renterService.clearAllNotifications();
    if (res.success) {
      setNotifications([]);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesType = filterType === 'all' || n.type === filterType;
    const matchesRead =
      filterRead === 'all' ||
      (filterRead === 'read' && n.read) ||
      (filterRead === 'unread' && !n.read);
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesRead && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <NotificationsHeader
        unreadCount={unreadCount}
        totalCount={notifications.length}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
      />

      <NotificationsStats notifications={notifications} unreadCount={unreadCount} />

      <div className="space-y-4 mb-6">
        <NotificationSearch searchTerm={searchTerm} onSearch={setSearchTerm} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NotificationFilters
            filterType={filterType}
            setFilterType={setFilterType}
            filterRead={filterRead}
            setFilterRead={setFilterRead}
          />
          <NotificationsList
            notifications={filteredNotifications}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        </div>
        <div className="space-y-6">
          <NotificationPreferences />
          <NotificationAnalytics notifications={notifications} />
          <NotificationSound />
          <DoNotDisturb />
        </div>
      </div>
    </>
  );
}
