'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X } from '@sureground/icons';
import { Logo } from '@/components/ui/Logo';
import { IconButton, ThemeToggle } from '@sureground/ui';
import { ResidentProfileDropdown } from './ResidentProfileDropdown';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { RoleMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { residentNavigation } from '@/lib/navigation/roles/resident';
import { ResidentAssistant } from './ResidentAssistant';
import {
  TopBarAccount,
  TopBarDivider,
  WorkspacePill,
} from '@/components/shared/navigation/TopBarParts';

interface ResidentNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const ResidentNavbar = ({ user }: ResidentNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        aria-label="Top bar"
        className={`workspace-navbar sticky top-0 z-50 transition-shadow duration-200 ${isScrolled ? 'shadow-xs' : ''}`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-2 h-16">
            <div className="flex min-w-0 items-center gap-3">
              <Logo
                size="md"
                className="shrink-0 [&>span]:sr-only min-[360px]:[&>span]:not-sr-only"
              />
              <TopBarDivider className="hidden md:block" />
              <WorkspacePill
                label={residentNavigation.workspaceLabel}
                className="hidden md:inline-flex"
              />
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <ThemeToggle />
              <ResidentAssistant />
              <NotificationBell portal="resident" basePath="/estate/resident/notifications" />
              <TopBarDivider className="mx-1 hidden sm:block" />
              <TopBarAccount>
                <ResidentProfileDropdown user={user} />
              </TopBarAccount>

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
            initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="fixed top-16 left-0 right-0 z-[60] bg-background border-b border-border lg:hidden bottom-0 overflow-y-auto overscroll-contain"
          >
            <RoleMobileNavigation
              config={residentNavigation}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
