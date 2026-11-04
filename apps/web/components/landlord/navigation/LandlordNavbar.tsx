'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton, SearchInput, ThemeToggle } from '@getrentos/ui';
import { LandlordProfileDropdown } from './LandlordProfileDropdown';
import { navGroups } from '../dashboard/LandlordSidebar';
import { GroupedMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { ROUTES } from '@/lib/constants/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { LandlordAssistant } from '../assistant/LandlordAssistant';
import { ManagerAssistant } from '@/components/agency/assistant/ManagerAssistant';

interface LandlordNavbarProps {
  user: { fullName: string; email: string; roles?: string[] } | null;
}

export const LandlordNavbar = ({ user }: LandlordNavbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  // The agency workspace borrows this navbar: there, and for a manager without
  // a landlord role, questions are about the firm's book, not a landlord's own.
  const roles = user?.roles ?? [];
  const asManager =
    pathname?.startsWith('/agency') ||
    (roles.includes('PROPERTY_MANAGER') && !roles.includes('LANDLORD'));
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
      <nav className={`workspace-navbar sticky top-0 z-50 ${isScrolled ? 'shadow-xs' : ''}`}>
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

              {asManager ? <ManagerAssistant /> : <LandlordAssistant />}

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
