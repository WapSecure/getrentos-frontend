'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { IconButton, Logo, ThemeToggle } from '@sureground/ui';
import { AdminProfileDropdown } from './AdminProfileDropdown';
import { ROUTES } from '@sureground/shared';
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
        aria-label="Top bar"
        className={`workspace-navbar sticky top-0 z-50 ${isScrolled ? 'shadow-xs' : ''}`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Logo href={ROUTES.ADMIN_DASHBOARD} size="md" />

            {/* Below lg the compact search row takes over; showing both squeezes the header past the viewport on tablets. */}
            <div className="hidden lg:flex flex-1 max-w-md mx-4">
              <AdminRecordSearch />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <AdminNotificationMenu />

              <AdminProfileDropdown user={user} />

              <IconButton
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden"
                icon={isMobileMenuOpen ? <X /> : <Menu />}
              />
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
