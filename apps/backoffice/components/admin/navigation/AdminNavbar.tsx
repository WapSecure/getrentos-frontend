'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo, ThemeToggle } from '@getrentos/ui';
import { AdminProfileDropdown } from './AdminProfileDropdown';
import { ROUTES } from '@getrentos/shared';
import { AdminMobileNavigation } from '@/components/admin/dashboard/AdminSidebar';
import { AdminRecordSearch } from './AdminRecordSearch';
import { AdminNotificationMenu } from './AdminNotificationMenu';

interface AdminNavbarProps {
  user: { fullName: string; email: string; roles?: string[] } | null;
}

export const AdminNavbar = ({ user }: AdminNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              <AdminRecordSearch />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <AdminNotificationMenu />

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
            <AdminRecordSearch compact />
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
