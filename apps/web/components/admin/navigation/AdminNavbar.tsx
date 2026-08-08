'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AdminProfileDropdown } from './AdminProfileDropdown';
import { formatRelativeTime } from '@/lib/format';

interface AdminNavbarProps {
  user: { fullName: string; email: string } | null;
}

interface NavNotification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  time: string;
}

export const AdminNavbar = ({ user }: AdminNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NavNotification[]>([
    {
      id: 1,
      title: 'New verification request',
      message: 'Segun Alabi submitted property documents for review',
      read: false,
      time: '2026-08-08T09:20:00.000Z',
    },
    {
      id: 2,
      title: 'Dispute escalated',
      message: 'Escrow dispute on Banana Island Penthouse needs attention',
      read: false,
      time: '2026-08-07T15:40:00.000Z',
    },
    {
      id: 3,
      title: 'Fraud alert flagged',
      message: 'Unusual login pattern detected on a buyer account',
      read: true,
      time: '2026-08-06T11:00:00.000Z',
    },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-[#0a1a1f]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10 shadow-sm'
            : 'bg-white dark:bg-[#0a1a1f] border-b border-gray-200 dark:border-white/10'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/admin/dashboard"
                className="text-gray-700 dark:text-gray-300 font-medium hover:text-[#c4a747] transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-500 dark:text-gray-400 hover:text-[#c4a747] transition-colors"
              >
                Users
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users, disputes, transactions..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1a2a2f] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1a2a2f] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-[#c4a747] hover:text-[#a88d3a]"
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
                              className={`p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${
                                !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                  {formatRelativeTime(notification.time)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <Link
                          href="/admin/dashboard"
                          className="block w-full text-center text-sm text-[#c4a747] hover:text-[#a88d3a] py-1"
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
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="md:hidden py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users, disputes, transactions..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1a2a2f] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747] focus:border-transparent"
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
            className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-[#0a1a1f] border-b border-gray-200 dark:border-white/10 md:hidden"
          >
            <div className="flex flex-col p-4 space-y-2">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Users
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
