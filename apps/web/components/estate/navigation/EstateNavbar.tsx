'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton, ThemeToggle } from '@getrentos/ui';
import { EstateProfileDropdown } from './EstateProfileDropdown';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { EstateSwitcher } from './EstateSwitcher';
import { navGroups } from '../dashboard/EstateSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { ROUTES } from '@/lib/constants/auth';

interface EstateNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const EstateNavbar = ({ user }: EstateNavbarProps) => {
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
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/75'
            : 'border-b border-border/50 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/60'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <EstateSwitcher />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell portal="estate" basePath="/estate/notifications" />
              <EstateProfileDropdown user={user} />

              <IconButton
                label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                icon={isMobileMenuOpen ? <X /> : <Menu />}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden"
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
            <GroupedMobileNavigation
              ariaLabel="Estate administration navigation"
              dashboardHref={ROUTES.ESTATE_DASHBOARD}
              groups={navGroups}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
