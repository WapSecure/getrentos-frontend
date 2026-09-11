'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, X } from 'lucide-react';
import { Logo, ThemeToggle } from '@getrentos/ui';
import { AdminProfileDropdown } from './AdminProfileDropdown';
import { formatRelativeTime, ROUTES, unwrap } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import { AdminMobileNavigation } from '@/components/admin/dashboard/AdminSidebar';

interface AdminNavbarProps {
  user: { fullName: string; email: string; roles?: string[] } | null;
}

export const AdminNavbar = ({ user }: AdminNavbarProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState('');
  const destinations = useMemo(() => [
    ['Dashboard', '/admin/dashboard'], ['Users', '/admin/users'], ['Verifications', '/admin/verifications'],
    ['Trust reviews', '/admin/trust/review-cases'], ['Land diligence', '/admin/land/diligence'],
    ['Shortlets', '/admin/shortlets'], ['Rentals', '/admin/rentals'], ['Units and tenants', '/admin/rentals/units'],
    ['Rent finance', '/admin/rent-finance'], ['Maintenance', '/admin/maintenance'], ['Marketplace', '/admin/marketplace'],
    ['Realtors', '/admin/realtors'], ['Agents', '/admin/agents'], ['Estates', '/admin/estates'],
    ['Disputes', '/admin/disputes'], ['Fraud and risk', '/admin/fraud'], ['Escrow oversight', '/admin/escrow'],
    ['Audit logs', '/admin/audit-logs'], ['Documents', '/admin/documents'], ['Messages', '/admin/messages'],
    ['Reports', '/admin/reports'], ['Settings', '/admin/settings'], ['Access and roles', '/admin/access'],
  ].filter(([label]) => label.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8), [search]);

  const submitSearch = () => {
    if (!search.trim() || !destinations[0]) return;
    router.push(destinations[0][1]);
    setSearch('');
  };
  const { data: notifications = [] } = useQuery({
    queryKey: adminKeys.notifications,
    queryFn: () => unwrap(adminService.getNotifications()),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => unwrap(adminService.markNotificationRead(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.notifications }),
  });
  const markAllRead = useMutation({
    mutationFn: () => unwrap(adminService.markAllNotificationsRead()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.notifications }),
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
            <Logo href={ROUTES.ADMIN_DASHBOARD} size="md" />

            <div className="hidden md:flex items-center gap-6">
              <Link
                href={ROUTES.ADMIN_DASHBOARD}
                className="text-foreground font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href={ROUTES.ADMIN_USERS}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Users
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <LegacyInput
                  type="text"
                  placeholder="Search users, disputes, transactions..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') submitSearch(); }}
                  aria-label="Search backoffice modules"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {search.trim() && (
                  <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl" role="listbox" aria-label="Matching backoffice modules">
                    {destinations.length ? destinations.map(([label, href]) => (
                      <button key={href} type="button" className="block w-full px-4 py-2.5 text-left text-sm hover:bg-secondary focus:bg-secondary focus:outline-none" onClick={() => { router.push(href); setSearch(''); }}>{label}</button>
                    )) : <p className="px-4 py-3 text-sm text-muted-foreground">No matching module. Open a register to search its records.</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
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
                      <div className="p-2 border-t border-border">
                        <Link
                          href="/admin/notifications"
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

              <AdminProfileDropdown user={user} />

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="lg:hidden py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <LegacyInput
                type="text"
                placeholder="Search users, disputes, transactions..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') submitSearch(); }}
                aria-label="Search backoffice modules"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {search.trim() && (
                <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  {destinations.length ? destinations.map(([label, href]) => <button key={href} type="button" className="block w-full px-4 py-2.5 text-left text-sm hover:bg-secondary" onClick={() => { router.push(href); setSearch(''); }}>{label}</button>) : <p className="px-4 py-3 text-sm text-muted-foreground">No matching module.</p>}
                </div>
              )}
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
            className="fixed top-16 left-0 right-0 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background lg:hidden"
          >
            <AdminMobileNavigation
              roles={user?.roles}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
