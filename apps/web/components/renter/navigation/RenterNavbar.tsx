'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { IconButton, Input, ThemeToggle } from '@getrentos/ui';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { RenterProfileDropdown } from './RenterProfileDropdown';
import { isRenterRouteActive, navGroups } from '../dashboard/RenterSidebar';
import { ROUTES } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/75'
            : 'border-b border-border/50 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/60'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Logo size="md" />

            {/* Desktop Navigation Links */}
            <div className="hidden items-center gap-1 rounded-xl bg-secondary/60 p-1 md:flex">
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

            {/* Search Bar - Desktop */}
            <form
              className="mx-4 hidden max-w-md flex-1 md:flex"
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

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <LanguageToggle />
              </div>
              <ThemeToggle />

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

              {/* Profile Dropdown */}
              <RenterProfileDropdown user={user} />

              {/* Mobile Menu Button */}
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

          {/* Mobile Search Bar */}
          <form className="py-3 md:hidden" role="search" onSubmit={handleSearch}>
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="renter-mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-0 right-0 top-32 z-[60] max-h-[calc(100dvh-8rem)] overflow-y-auto border-b border-border bg-background md:top-16 md:max-h-[calc(100dvh-4rem)] lg:hidden"
          >
            <div className="flex flex-col p-4 space-y-1">
              <div className="sm:hidden flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('language.switch_language')}
                </span>
                <LanguageToggle />
              </div>
              {navGroups.map((group) => (
                <div
                  key={group.label}
                  className="border-t border-border/70 pt-3 first:border-0 first:pt-0"
                >
                  <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const isActive = isRenterRouteActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-secondary'}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="w-4 h-4" aria-hidden="true" />
                        {item.labelKey ? t(item.labelKey) : item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
