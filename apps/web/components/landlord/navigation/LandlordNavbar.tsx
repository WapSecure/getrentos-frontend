'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import {
  IconButton,
  SearchInput,
  ThemeToggle,
} from '@getrentos/ui';
import { LandlordProfileDropdown } from './LandlordProfileDropdown';
import { navGroups } from '../dashboard/LandlordSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { ROUTES } from '@/lib/constants/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';

interface LandlordNavbarProps {
  user: { fullName: string; email: string; roles?: string[] } | null;
}

export const LandlordNavbar = ({ user }: LandlordNavbarProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`${ROUTES.LANDLORD_PROPERTIES}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
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
            <Logo size="md" />

            <div className="hidden md:flex items-center gap-6">
              <Link
                href={ROUTES.LANDLORD_DASHBOARD}
                className="text-foreground font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href={ROUTES.LANDLORD_PROPERTIES}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Properties
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchInput
                className="w-full"
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleSearchSubmit}
                placeholder="Search properties, tenants..."
                label="Search properties and tenants"
              />
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <NotificationBell
                portal="landlord"
                queryKey={landlordKeys.notifications}
                fetchNotifications={() => unwrap(landlordService.getNotifications())}
                markRead={(id) => unwrap(landlordService.markNotificationRead(id))}
                markAllRead={() => unwrap(landlordService.markAllNotificationsRead())}
                refetchAfterMarking
                viewAllHref={ROUTES.LANDLORD_DASHBOARD}
              />

              <LandlordProfileDropdown user={user} />

              <IconButton
                label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden"
                icon={isMobileMenuOpen ? <X /> : <Menu />}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </div>

          <div className="md:hidden py-3">
            <SearchInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={handleSearchSubmit}
              placeholder="Search properties, tenants..."
              label="Search properties and tenants"
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
              ariaLabel="Landlord navigation"
              dashboardHref={ROUTES.LANDLORD_DASHBOARD}
              onNavigate={() => setIsMobileMenuOpen(false)}
              groups={navGroups.map((group) => ({
                ...group,
                items: group.items.map((item) => ({
                  ...item,
                  label: t(item.labelKey),
                })),
              }))}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
