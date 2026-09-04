'use client';

import { LegacyInput } from '@getrentos/ui';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@getrentos/ui';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { RenterProfileDropdown } from './RenterProfileDropdown';
import { isRenterRouteActive, navGroups } from '../dashboard/RenterSidebar';
import { ROUTES } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { useRealtimeEvent } from '@/hooks/useRealtime';

interface RenterNavbarProps {
  user: { fullName: string; email: string; role?: string; roles?: string[] } | null;
}

export const RenterNavbar = ({ user }: RenterNavbarProps) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: [...renterKeys.notifications, { page: 1, pageSize: 5 }],
    queryFn: () => unwrap(renterService.listNotifications({ page: 1, pageSize: 5 })),
  });
  const notifications = data?.items ?? [];

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.notifications });

  // Real-time: refresh the bell when the backend pushes a new notification.
  useRealtimeEvent('notification:new', () => {
    invalidateNotifications();
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.markNotificationAsRead(id)),
    onSuccess: invalidateNotifications,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => unwrap(renterService.markAllNotificationsAsRead()),
    onSuccess: invalidateNotifications,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const closeOverlays = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setShowNotifications(false);
      }
    };
    const closeNotifications = (event: MouseEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('keydown', closeOverlays);
    document.addEventListener('mousedown', closeNotifications);
    return () => {
      document.removeEventListener('keydown', closeOverlays);
      document.removeEventListener('mousedown', closeNotifications);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    router.push(
      query ? `${ROUTES.RENTER_DISCOVER}?q=${encodeURIComponent(query)}` : ROUTES.RENTER_DISCOVER
    );
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/75'
            : 'border-b border-border/50 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/60'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Logo size="md" />

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href={ROUTES.RENTER_DASHBOARD}
                className="text-foreground font-medium hover:text-primary transition-colors"
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                href={ROUTES.RENTER_DISCOVER}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.discover')}
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <form
              className="mx-4 hidden max-w-md flex-1 md:flex"
              role="search"
              onSubmit={handleSearch}
            >
              <div className="relative w-full">
                <button
                  type="submit"
                  aria-label="Submit property search"
                  className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Search aria-hidden="true" className="w-4" />
                </button>
                <LegacyInput
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Search properties and locations"
                  placeholder={t('nav.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </form>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <LanguageToggle />
              </div>
              <ThemeToggle />

              {/* Notifications */}
              <div ref={notificationsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label={
                    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
                  }
                  aria-expanded={showNotifications}
                  aria-controls="renter-notifications-menu"
                  className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      id="renter-notifications-menu"
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
                            <button
                              type="button"
                              key={notification.id}
                              className={`block w-full p-3 text-left border-b border-border hover:bg-secondary transition-colors ${
                                !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-foreground">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {notification.message}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t border-border">
                        <Link
                          href={ROUTES.RENTER_NOTIFICATIONS}
                          onClick={() => setShowNotifications(false)}
                          className="block w-full text-center text-sm text-primary hover:text-primary-hover py-1"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile Dropdown */}
              <RenterProfileDropdown user={user} />

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="renter-mobile-menu"
                className="lg:hidden p-2 rounded-lg hover:bg-secondary"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <form className="py-3 md:hidden" role="search" onSubmit={handleSearch}>
            <div className="relative">
              <button
                type="submit"
                aria-label="Submit property search"
                className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Search aria-hidden="true" className="w-4" />
              </button>
              <LegacyInput
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search properties and locations"
                placeholder={t('nav.search_placeholder')}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </form>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="renter-mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-0 right-0 top-32 z-[60] max-h-[calc(100dvh-8rem)] overflow-y-auto border-b border-border bg-background md:top-16 md:max-h-[calc(100dvh-4rem)] lg:hidden"
          >
            <div className="flex flex-col p-4 space-y-1">
              <div className="sm:hidden flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('language.switch_language')}
                </span>
                <LanguageToggle />
              </div>
              {navGroups.map((group) => (
                <div
                  key={group.label}
                  className="border-t border-border/70 pt-3 first:border-0 first:pt-0"
                >
                  <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const isActive = isRenterRouteActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-secondary'}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="w-4 h-4" aria-hidden="true" />
                        {item.labelKey ? t(item.labelKey) : item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
