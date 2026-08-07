'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
import { NotificationsHeader } from '@/components/renter/notifications/NotificationsHeader';
import { NotificationsStats } from '@/components/renter/notifications/NotificationsStats';
import { NotificationsList } from '@/components/renter/notifications/NotificationsList';
import { NotificationFilters } from '@/components/renter/notifications/NotificationFilters';
import { NotificationPreferences } from '@/components/renter/notifications/NotificationPreferences';
import { NotificationAnalytics } from '@/components/renter/notifications/NotificationAnalytics';
import { DoNotDisturb } from '@/components/renter/notifications/DoNotDisturb';
import { NotificationSearch } from '@/components/renter/notifications/NotificationSearch';
import { NotificationSound } from '@/components/renter/notifications/NotificationSound';
import { ROUTES, isAuthenticated, STORAGE_KEYS } from '@/lib/constants/auth';
import { Notification } from '@/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'application',
        title: 'Application Update',
        message: 'Your application for Modern Downtown Loft is under review',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        action: {
          label: 'View Application',
          url: '/renter/applications',
        },
        metadata: {
          applicationId: 'app_001',
          propertyId: 'prop_001',
        },
      },
      {
        id: '2',
        type: 'message',
        title: 'New Message',
        message: 'Jane Smith sent you a message about the lease agreement',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        action: {
          label: 'View Message',
          url: '/renter/messages',
        },
        metadata: {
          messageId: 'msg_001',
          sender: 'Jane Smith',
        },
      },
      {
        id: '3',
        type: 'payment',
        title: 'Payment Confirmed',
        message: 'Your rent payment of ₦200,000 for June 2024 was successful',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        action: {
          label: 'View Receipt',
          url: '/renter/payments',
        },
        metadata: {
          paymentId: 'pay_001',
          amount: 200000,
        },
      },
      {
        id: '4',
        type: 'maintenance',
        title: 'Maintenance Update',
        message: 'Quick Plumbing Services has been assigned to your maintenance request',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        action: {
          label: 'Track Progress',
          url: '/renter/maintenance',
        },
        metadata: {
          maintenanceId: 'maint_001',
        },
      },
      {
        id: '5',
        type: 'lease',
        title: 'Lease Renewal Reminder',
        message: 'Your lease is expiring in 30 days. Review your renewal options.',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        action: {
          label: 'View Lease',
          url: '/renter/lease',
        },
        metadata: {
          leaseId: 'lease_001',
        },
      },
      {
        id: '6',
        type: 'system',
        title: 'Trust Score Update',
        message: 'Your trust score has increased to 78! Keep up the good work.',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        action: {
          label: 'View Trust Score',
          url: '/renter/trust-score',
        },
        metadata: {
          trustScore: 78,
        },
      },
    ];
    setNotifications(mockNotifications);
  };

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      loadNotifications();
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RenterNavbar user={user} />

      <div className="flex">
        <RenterSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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
          </div>
        </main>
      </div>
    </div>
  );
}
