'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button, IconButton, SearchInput, ThemeToggle, useOptimisticMutation } from '@getrentos/ui';
import { BuyerProfileDropdown } from './BuyerProfileDropdown';
import { navGroups } from '../dashboard/BuyerSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { formatRelativeTime } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';
import { ROUTES } from '@/lib/constants/auth';
import { useRealtimeEvent } from '@/hooks/useRealtime';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { notificationHref } from '@/lib/notificationHref';

interface BuyerNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const BuyerNavbar = ({ user }: BuyerNavbarProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`${ROUTES.BUYER_DISCOVER}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsKey = [...buyerKeys.notifications, { page: 1, pageSize: 20 }];
  const { data: notificationsData } = useQuery({
    queryKey: notificationsKey,
    queryFn: () => unwrap(buyerService.getNotifications({ page: 1, pageSize: 20 })),
  });
  const notifications = notificationsData?.items ?? [];

  const markRead = useOptimisticMutation({
    mutationFn: (id: string) => unwrap(buyerService.markNotificationRead(id)),
    patches: () => [
      {
        queryKey: notificationsKey,
        update: (old, id) => {
          const page = old as { items: { id: string; read: boolean }[] };
          return {
            ...page,
            items: page.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
          };
        },
      },
    ],
    invalidate: [buyerKeys.notifications],
  });
  const markAllRead = useOptimisticMutation({
    mutationFn: () => unwrap(buyerService.markAllNotificationsRead()),
    patches: () => [
      {
        queryKey: notificationsKey,
        update: (old) => {
          const page = old as { items: { read: boolean }[] };
          return { ...page, items: page.items.map((n) => ({ ...n, read: true })) };
        },
      },
    ],
    invalidate: [buyerKeys.notifications],
  });

  // Real-time: refresh the bell when the backend pushes a new notification.
  useRealtimeEvent('notification:new', () => {
    queryClient.invalidateQueries({ queryKey: buyerKeys.notifications });
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
    const href = notificationHref('buyer', notification);
    if (href) {
      setShowNotifications(false);
      router.push(href);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllRead.mutate(undefined);
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
                href={ROUTES.BUYER_DISCOVER}
                className="text-foreground font-medium hover:text-primary transition-colors"
              >
                Discover
              </Link>
              <Link
                href={ROUTES.BUYER_SAVED}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Saved
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchInput
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleSearchSubmit}
                placeholder="Search properties, locations..."
                label="Search properties"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <div className="relative">
                <IconButton
                  label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                  icon={<Bell />}
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications(!showNotifications)}
                />
                {unreadCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"
                  />
                )}

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
                              className={`block w-full text-left p-3 border-b border-border hover:bg-secondary cursor-pointer transition-colors ${
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
                      <div className="p-2 border-t border-border">
                        <Link
                          href={ROUTES.BUYER_DASHBOARD}
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

              <BuyerProfileDropdown user={user} />

              <IconButton
                label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                icon={isMobileMenuOpen ? <X /> : <Menu />}
                aria-expanded={isMobileMenuOpen}
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
              placeholder="Search properties, locations..."
              label="Search properties"
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
              ariaLabel="Buyer navigation"
              dashboardHref={ROUTES.BUYER_DASHBOARD}
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
