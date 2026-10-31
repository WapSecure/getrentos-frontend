'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton, ThemeToggle } from '@getrentos/ui';
import { ResidentProfileDropdown } from './ResidentProfileDropdown';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { residentNavGroups } from './ResidentSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { ROUTES } from '@/lib/constants/auth';

interface ResidentNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const ResidentNavbar = ({ user }: ResidentNavbarProps) => {
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
          <div className="flex justify-between items-center gap-2 h-16">
            <Logo
              size="md"
              className="shrink-0 [&>span]:sr-only min-[360px]:[&>span]:not-sr-only"
            />

            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              <ThemeToggle />
              <NotificationBell portal="resident" basePath="/estate/resident/notifications" />
              <ResidentProfileDropdown user={user} />

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
              ariaLabel="Resident navigation"
              dashboardHref={ROUTES.RESIDENT_DASHBOARD}
              groups={residentNavGroups}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
