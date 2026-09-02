'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Pagination, ThemeToggle } from '@getrentos/ui';
import { RealtorProfileDropdown } from './RealtorProfileDropdown';
import { navItems } from '../dashboard/RealtorSidebar';
import { formatRelativeTime } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';
import { ROUTES } from '@/lib/constants/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface RealtorNavbarProps {
  user: { fullName: string; email: string } | null;
}

const NOTIFICATIONS_PAGE_SIZE = 50;

export const RealtorNavbar = ({ user }: RealtorNavbarProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  });
  const notifications = notificationsPage?.items ?? [];
  const notificationsTotal = notificationsPage?.total ?? 0;

  const markRead = useMutation({
    mutationFn: (id: string) => unwrap(realtorService.markNotificationRead(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: realtorKeys.notifications }),
  });
  const markAllRead = useMutation({
    mutationFn: () => unwrap(realtorService.markAllNotificationsRead()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: realtorKeys.notifications }),
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
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <LegacyInput
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  placeholder="Search clients, listings, leads..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <div className="relative">
                <button
                  onClick={() => {
                    if (!showNotifications) setNotificationPage(1);
                    setShowNotifications(!showNotifications);
                  }}
                  className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-lg border border-border z-50"
                    >
                      <div className="p-3 border-b border-border flex justify-between items-center">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-primary hover:text-primary-hover"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">No notifications</div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-secondary cursor-pointer transition-colors ${
                                !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-foreground">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{notification.body}</p>
                            </div>
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

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="md:hidden py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <LegacyInput
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Search clients, listings, leads..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
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
            <div className="flex flex-col p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
