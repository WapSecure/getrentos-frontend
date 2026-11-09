'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton, SearchInput, ThemeToggle } from '@getrentos/ui';
import { RealtorProfileDropdown } from './RealtorProfileDropdown';
import { navGroups } from '../dashboard/RealtorSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';
import { ROUTES } from '@/lib/constants/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { RealtorAssistant } from '../assistant/RealtorAssistant';

interface RealtorNavbarProps {
  user: { fullName: string; email: string } | null;
}

const NOTIFICATIONS_PAGE_SIZE = 50;

export const RealtorNavbar = ({ user }: RealtorNavbarProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`${ROUTES.REALTOR_LISTINGS}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`workspace-navbar sticky top-0 z-50 ${isScrolled ? 'shadow-xs' : ''}`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Logo size="md" />

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchInput
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleSearchSubmit}
                placeholder="Search clients, listings, leads..."
                label="Search clients, listings and leads"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <RealtorAssistant />

              <NotificationBell
                portal="realtor"
                queryKey={realtorKeys.notifications}
                pageSize={NOTIFICATIONS_PAGE_SIZE}
                paginate
                fetchNotifications={({ page, pageSize }) =>
                  unwrap(realtorService.getNotifications({ page, pageSize }))
                }
                markRead={(id) => unwrap(realtorService.markNotificationRead(id))}
                markAllRead={() => unwrap(realtorService.markAllNotificationsRead())}
                refetchAfterMarking
                realtime={false}
                viewAllHref={ROUTES.REALTOR_DASHBOARD}
              />

              <RealtorProfileDropdown user={user} />

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
              placeholder="Search clients, listings, leads..."
              label="Search clients, listings and leads"
              className="w-full"
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
            className="fixed top-16 left-0 right-0 z-[60] bg-background border-b border-border lg:hidden bottom-0 overflow-y-auto overscroll-contain"
          >
            <GroupedMobileNavigation
              ariaLabel="Realtor navigation"
              workspaceLabel="Realtor"
              dashboardHref={ROUTES.REALTOR_DASHBOARD}
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
