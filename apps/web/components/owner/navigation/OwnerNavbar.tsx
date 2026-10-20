'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import {
  Button,
  IconButton,
  SearchInput,
  ThemeToggle,
  useOptimisticMutation,
} from '@getrentos/ui';
import { OwnerProfileDropdown } from './OwnerProfileDropdown';
import { navGroups } from '../dashboard/OwnerSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { formatRelativeTime } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ownerService } from '@/services/ownerService';
import { ROUTES } from '@/lib/constants/auth';
import { useRealtimeEvent } from '@/hooks/useRealtime';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { notificationHref } from '@/lib/notificationHref';

interface OwnerNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const OwnerNavbar = ({ user }: OwnerNavbarProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`${ROUTES.OWNER_PROPERTIES}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // The navbar is intentionally a bounded preview; the endpoint itself is
  // paginated so a future full notifications workspace can page every record.
  const notificationsKey = [...ownerKeys.notifications, { page: 1, pageSize: 50 }];
  const { data: notificationsPage } = useQuery({
    queryKey: notificationsKey,
    queryFn: () => unwrap(ownerService.getNotifications({ page: 1, pageSize: 50 })),
  });
  const notifications = notificationsPage?.items ?? [];
  type NotificationsPage = NonNullable<typeof notificationsPage>;
  const markItemsRead = (old: unknown, isTarget: (id: string) => boolean) => {
    const page = old as NotificationsPage;
    return {
      ...page,
      items: page.items.map((n) => (isTarget(n.id) ? { ...n, read: true } : n)),
    };
  };

  const markRead = useOptimisticMutation({
    mutationFn: (id: string) => unwrap(ownerService.markNotificationRead(id)),
    patches: () => [
      { queryKey: notificationsKey, update: (old, id) => markItemsRead(old, (n) => n === id) },
    ],
    invalidate: [ownerKeys.notifications],
  });
  const markAllRead = useOptimisticMutation({
    mutationFn: () => unwrap(ownerService.markAllNotificationsRead()),
    patches: () => [
      { queryKey: notificationsKey, update: (old) => markItemsRead(old, () => true) },
    ],
    invalidate: [ownerKeys.notifications],
  });

  // Real-time: refresh the bell when the backend pushes a new notification.
  useRealtimeEvent('notification:new', () => {
    queryClient.invalidateQueries({ queryKey: ownerKeys.notifications });
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
    const href = notificationHref('owner', notification);
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
                href={ROUTES.OWNER_DASHBOARD}
                className="text-foreground font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href={ROUTES.OWNER_PROPERTIES}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Properties
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchInput
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleSearchSubmit}
                placeholder="Search properties, buyers..."
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <div className="relative">
                <IconButton
                  onClick={() => setShowNotifications(!showNotifications)}
                  label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                  aria-expanded={showNotifications}
                  className="relative"
                  icon={
                    <>
                      <Bell />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
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
                          <div className="p-4 text-center text-muted-foreground">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              type="button"
                              key={notification.id}
                              className={`block w-full p-3 text-left border-b border-border hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                                !notification.read ? 'bg-primary/5' : ''
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
                      <div className="p-2 border-t border-border">
                        <Link
                          href={ROUTES.OWNER_DASHBOARD}
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

              <OwnerProfileDropdown user={user} />

              <IconButton
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden"
                icon={isMobileMenuOpen ? <X /> : <Menu />}
              />
            </div>
          </div>

          <div className="md:hidden py-3">
            <SearchInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={handleSearchSubmit}
              placeholder="Search properties, buyers..."
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
              ariaLabel="Property owner navigation"
              dashboardHref={ROUTES.OWNER_DASHBOARD}
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
