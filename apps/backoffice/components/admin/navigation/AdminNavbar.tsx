'use client';

import { useState, useEffect, useRef, type RefObject } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X } from '@sureground/icons';
import { IconButton, Logo, ThemeToggle } from '@sureground/ui';
import { AdminProfileDropdown } from './AdminProfileDropdown';
import { ROUTES } from '@sureground/shared';
import { AdminMobileNavigation } from '@/components/admin/dashboard/AdminSidebar';
import { AdminRecordSearch } from './AdminRecordSearch';
import { AdminNotificationMenu } from './AdminNotificationMenu';

const isEditable = (el: Element | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** "/" outside a field focuses the visible record search; skipped while an overlay has focus. */
function useSlashToSearch(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    scope.current
      ?.querySelectorAll('input')
      .forEach((input) => input.setAttribute('aria-keyshortcuts', '/'));
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.defaultPrevented) return;
      const active = document.activeElement;
      if (isEditable(active)) return;
      if (active?.closest('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;
      const input = Array.from(scope.current?.querySelectorAll('input') ?? []).find(
        (el) => el.getClientRects().length > 0
      );
      if (!input) return;
      event.preventDefault();
      input.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [scope]);
}

interface AdminNavbarProps {
  user: { fullName: string; email: string; roles?: string[] } | null;
}

export const AdminNavbar = ({ user }: AdminNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useSlashToSearch(barRef);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        ref={barRef}
        aria-label="Top bar"
        className={`workspace-navbar sticky top-0 z-50 transition-shadow duration-200 ${isScrolled ? 'shadow-xs' : ''}`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* As in the web navbars: the wordmark is too wide for a phone top bar and pushed the profile menu over the menu button. */}
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <Logo
                href={ROUTES.ADMIN_DASHBOARD}
                size="md"
                className="shrink-0 [&>span]:sr-only sm:[&>span]:not-sr-only"
              />
              <span aria-hidden="true" className="hidden h-6 w-px bg-border lg:block" />
              <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-xs lg:inline-flex">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
                Back office
              </span>
            </div>

            {/* Below lg the compact search row takes over; showing both squeezes the header past the viewport on tablets. */}
            <div className="shell-search group relative mx-4 hidden max-w-md flex-1 lg:flex">
              <AdminRecordSearch />
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 inline-flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-background px-1.5 font-mono text-2xs font-medium text-muted-foreground group-focus-within:hidden group-has-[input:not(:placeholder-shown)]:hidden"
              >
                /
              </kbd>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <ThemeToggle />

              <AdminNotificationMenu />

              <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border sm:block" />

              <div className="shell-account flex shrink-0 items-center">
                <AdminProfileDropdown user={user} />
              </div>

              <IconButton
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden"
                icon={isMobileMenuOpen ? <X /> : <Menu />}
              />
            </div>
          </div>

          <div className="pb-3 lg:hidden">
            <AdminRecordSearch compact />
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
