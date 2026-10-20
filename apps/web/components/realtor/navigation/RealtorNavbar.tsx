'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import {
  Button,
  EmptyState,
  IconButton,
  Pagination,
  SearchInput,
  ThemeToggle,
  useOptimisticMutation,
} from '@getrentos/ui';
import { RealtorProfileDropdown } from './RealtorProfileDropdown';
import { navGroups } from '../dashboard/RealtorSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { formatRelativeTime } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';
import { ROUTES } from '@/lib/constants/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { notificationHref } from '@/lib/notificationHref';

interface RealtorNavbarProps {
  user: { fullName: string; email: string } | null;
}

const NOTIFICATIONS_PAGE_SIZE = 50;

export const RealtorNavbar = ({ user }: RealtorNavbarProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`${ROUTES.REALTOR_LISTINGS}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPage, setNotificationPage] = useState(1);
  const { data: notificationsPage } = useQuery({
    queryKey: [
      ...realtorKeys.notifications,
      { page: notificationPage, pageSize: NOTIFICATIONS_PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        realtorService.getNotifications({
          page: notificationPage,
          pageSize: NOTIFICATIONS_PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const notifications = notificationsPage?.items ?? [];
  const notificationsTotal = notificationsPage?.total ?? 0;

  const notificationsKey = [
    ...realtorKeys.notifications,
    { page: notificationPage, pageSize: NOTIFICATIONS_PAGE_SIZE },
  ];
  type NotificationsPage = NonNullable<typeof notificationsPage>;
  const markRead = useOptimisticMutation({
    mutationFn: (id: string) => unwrap(realtorService.markNotificationRead(id)),
    patches: (id) => [
      {
        queryKey: notificationsKey,
        update: (old) => {
          const page = old as NotificationsPage;
          return {
            ...page,
            items: page.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
          };
        },
      },
    ],
    invalidate: [realtorKeys.notifications],
  });
  const markAllRead = useOptimisticMutation({
    mutationFn: () => unwrap(realtorService.markAllNotificationsRead()),
    patches: () => [
      {
        queryKey: notificationsKey,
        update: (old) => {
          const page = old as NotificationsPage;
          return { ...page, items: page.items.map((n) => ({ ...n, read: true })) };
        },
      },
    ],
    invalidate: [realtorKeys.notifications],
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markRead.mutate(id);
  };

  // Mark it read, then open what it is about (if it is about something).
  const handleOpenNotification = (notification: {
    id: string;
    type: string;
    read: boolean;
    actionUrl?: string;
    conversationId?: string;
    action?: { url: string };
  }) => {
    if (!notification.read) handleMarkAsRead(notification.id);
    const href = notificationHref('realtor', notification);
    if (href) {
      setShowNotifications(false);
      router.push(href);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllRead.mutate();
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/75'
            : 'border-b border-border/50 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/60'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />

            <div className="hidden md:flex items-center gap-6">
              <Link
                href={ROUTES.REALTOR_DASHBOARD}
                className="text-foreground font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href={ROUTES.REALTOR_LISTINGS}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Listings
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchInput
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleSearchSubmit}
                placeholder="Search clients, listings, leads..."
                label="Search clients, listings and leads"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <div className="relative">
                <IconButton
                  label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                  aria-expanded={showNotifications}
                  onClick={() => {
                    if (!showNotifications) setNotificationPage(1);
                    setShowNotifications(!showNotifications);
                  }}
                  className="relative"
                  icon={
                    <>
                      <Bell />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </>
                  }
                />

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card rounded-xl shadow-lg border border-border z-50"
                    >
                      <div className="p-3 border-b border-border flex justify-between items-center">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                          <Button variant="ghost" size="xs" onClick={handleMarkAllAsRead}>
                            Mark all as read
                          </Button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <EmptyState icon={Bell} title="No notifications" size="compact" bare />
                        ) : (
                          notifications.map((notification) => (
                            <button
                              type="button"
                              key={notification.id}
                              className={`block w-full text-left p-3 border-b border-border hover:bg-secondary transition-colors ${
                                !notification.read ? 'bg-info-subtle/50' : ''
                              }`}
                              onClick={() => handleOpenNotification(notification)}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-foreground">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{notification.body}</p>
                            </button>
                          ))
                        )}
                      </div>
                      {notificationsTotal > NOTIFICATIONS_PAGE_SIZE && (
                        <Pagination
                          page={notificationPage}
                          pageSize={NOTIFICATIONS_PAGE_SIZE}
                          total={notificationsTotal}
                          onPageChange={setNotificationPage}
                        />
                      )}
                      <div className="p-2 border-t border-border">
                        <Link
                          href={ROUTES.REALTOR_DASHBOARD}
                          className="block w-full text-center text-sm text-primary hover:text-primary-hover py-1"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <RealtorProfileDropdown user={user} />

              <IconButton
                label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                icon={isMobileMenuOpen ? <X /> : <Menu />}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden"
              />
            </div>
          </div>

          <div className="md:hidden py-3">
            <SearchInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={handleSearchSubmit}
              placeholder="Search clients, listings, leads..."
              label="Search clients, listings and leads"
              className="w-full"
            />
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-[60] bg-background border-b border-border lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <GroupedMobileNavigation
              ariaLabel="Realtor navigation"
              dashboardHref={ROUTES.REALTOR_DASHBOARD}
              onNavigate={() => setIsMobileMenuOpen(false)}
              groups={navGroups.map((group) => ({
                ...group,
                items: group.items.map((item) => ({
                  ...item,
                  label: item.labelKey ? t(item.labelKey) : item.label,
                })),
              }))}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
