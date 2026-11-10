'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X } from '@sureground/icons';
import { Logo } from '@/components/ui/Logo';
import { IconButton, Input, ThemeToggle } from '@sureground/ui';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { LANGUAGE_CHOICE_ENABLED, useLanguage } from '@/lib/i18n/LanguageContext';
import { RenterProfileDropdown } from './RenterProfileDropdown';
import { RoleMobileNavigation } from '@/components/shared/dashboard/GroupedSidebar';
import { renterNavigation } from '@/lib/navigation/roles/renter';
import { ROUTES } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { RenterAssistant } from '../assistant/RenterAssistant';

interface RenterNavbarProps {
  user: { fullName: string; email: string; role?: string; roles?: string[] } | null;
}

export const RenterNavbar = ({ user }: RenterNavbarProps) => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const closeMobileMenu = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', closeMobileMenu);
    return () => document.removeEventListener('keydown', closeMobileMenu);
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    router.push(
      query ? `${ROUTES.RENTER_DISCOVER}?q=${encodeURIComponent(query)}` : ROUTES.RENTER_DISCOVER
    );
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className={`workspace-navbar sticky top-0 z-50 ${isScrolled ? 'shadow-xs' : ''}`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Logo size="md" className="shrink-0 [&>span]:sr-only sm:[&>span]:not-sr-only" />

            <div className="hidden items-center gap-1 rounded-xl bg-secondary/60 p-1 xl:flex">
              <Link
                href={ROUTES.RENTER_DASHBOARD}
                aria-current={pathname === ROUTES.RENTER_DASHBOARD ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname === ROUTES.RENTER_DASHBOARD
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                href={ROUTES.RENTER_DISCOVER}
                aria-current={pathname.startsWith(ROUTES.RENTER_DISCOVER) ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname.startsWith(ROUTES.RENTER_DISCOVER)
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('nav.discover')}
              </Link>
            </div>

            <form
              className="mx-4 hidden max-w-md flex-1 lg:flex"
              role="search"
              onSubmit={handleSearch}
            >
              <Input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search properties and locations"
                placeholder={t('nav.search_placeholder')}
                className="w-full"
                leadingIcon={
                  <button
                    type="submit"
                    aria-label="Submit property search"
                    className="-ml-1 flex rounded-md p-1 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Search aria-hidden="true" className="w-4 h-4" />
                  </button>
                }
              />
            </form>

            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              {LANGUAGE_CHOICE_ENABLED && (
                <div className="hidden sm:block">
                  <LanguageToggle />
                </div>
              )}
              <ThemeToggle />

              <RenterAssistant />

              <NotificationBell
                portal="renter"
                queryKey={renterKeys.notifications}
                pageSize={5}
                fetchNotifications={() =>
                  unwrap(renterService.listNotifications({ page: 1, pageSize: 5 }))
                }
                markRead={(id) => unwrap(renterService.markNotificationAsRead(id))}
                markAllRead={() => unwrap(renterService.markAllNotificationsAsRead())}
                refetchAfterMarking
                viewAllHref={ROUTES.RENTER_NOTIFICATIONS}
              />

              <RenterProfileDropdown user={user} />

              <IconButton
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="renter-mobile-menu"
                className="lg:hidden"
                icon={isMobileMenuOpen ? <X /> : <Menu />}
              />
            </div>
          </div>

          <form className="py-3 lg:hidden" role="search" onSubmit={handleSearch}>
            <Input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search properties and locations"
              placeholder={t('nav.search_placeholder')}
              leadingIcon={
                <button
                  type="submit"
                  aria-label="Submit property search"
                  className="-ml-1 flex rounded-md p-1 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Search aria-hidden="true" className="w-4 h-4" />
                </button>
              }
            />
          </form>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="renter-mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-0 right-0 top-32 z-[60] bottom-0 overflow-y-auto border-b border-border bg-background lg:hidden"
          >
            {LANGUAGE_CHOICE_ENABLED && (
              <div className="px-4 pt-4">
                <div className="sm:hidden flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('language.switch_language')}
                  </span>
                  <LanguageToggle />
                </div>
              </div>
            )}
            <RoleMobileNavigation
              config={renterNavigation}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
