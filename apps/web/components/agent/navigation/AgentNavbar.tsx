'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, Wifi, WifiOff } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  SearchInput,
  ThemeToggle,
  useOptimisticMutation,
} from '@getrentos/ui';
import { AgentProfileDropdown } from './AgentProfileDropdown';
import { navGroups } from '../dashboard/AgentSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { formatRelativeTime } from '@/lib/format';
import { ROUTES } from '@/lib/constants/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';
import { agentService, type AgentNotification } from '@/services/agentService';
import { notificationHref } from '@/lib/notificationHref';
import { useRealtimeEvent } from '@/hooks/useRealtime';

interface AgentNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const AgentNavbar = ({ user }: AgentNavbarProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`${ROUTES.AGENT_TASKS}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({
    queryKey: agentKeys.notifications,
    queryFn: () => unwrap(agentService.getNotifications()),
  });
  const markRead = useOptimisticMutation({
    mutationFn: (id: string) => unwrap(agentService.markNotificationRead(id)),
    patches: (id) => [
      {
        queryKey: agentKeys.notifications,
        update: (old) =>
          (old as AgentNotification[]).map((n) => (n.id === id ? { ...n, read: true } : n)),
      },
    ],
  });
  const markAllRead = useOptimisticMutation({
    mutationFn: () => unwrap(agentService.markAllNotificationsRead()),
    patches: () => [
      {
        queryKey: agentKeys.notifications,
        update: (old) => (old as AgentNotification[]).map((n) => ({ ...n, read: true })),
      },
    ],
  });

  // Real-time: refresh the bell when the backend pushes a new notification.
  useRealtimeEvent('notification:new', () => {
    queryClient.invalidateQueries({ queryKey: agentKeys.notifications });
  });
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark it read, then open what it is about (if it is about something).
  const handleOpenNotification = (notification: AgentNotification) => {
    if (!notification.read) markRead.mutate(notification.id);
    const href = notificationHref('agent', notification);
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
                href={ROUTES.AGENT_TASKS}
                className="text-foreground font-medium hover:text-primary transition-colors"
              >
                Tasks
              </Link>
              <Link
                href={ROUTES.AGENT_SYNC}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Sync Center
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchInput
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleSearchSubmit}
                placeholder="Search tasks, properties..."
                label="Search tasks and properties"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant={isOnline ? 'success' : 'warning'}
                icon={isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                className="hidden sm:inline-flex"
              >
                {isOnline ? 'Online' : 'Offline'}
              </Badge>

              <ThemeToggle />

              <div className="relative">
                <IconButton
                  label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications(!showNotifications)}
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
                      <div className="p-2 border-t border-border">
                        <Link
                          href={ROUTES.AGENT_TASKS}
                          className="block w-full text-center text-sm text-primary hover:text-primary-hover py-1"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all tasks
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AgentProfileDropdown user={user} />

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
              placeholder="Search tasks, properties..."
              label="Search tasks and properties"
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
              ariaLabel="Agent navigation"
              dashboardHref={ROUTES.AGENT_DASHBOARD}
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
