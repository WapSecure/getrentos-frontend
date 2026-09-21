'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ThemeToggle,
} from '@getrentos/ui';
import { Logo } from '@/components/ui/Logo';
import { ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES, getDashboardRoute, getUserRole } from '@/lib/constants/auth';
import { ESTATE_MARKETPLACE_ROUTES } from '@/lib/constants/auth';
import { useAuthStore } from '@/lib/store/authStore';

interface NavLink {
  label: string;
  href: string;
  /** One line under the label in the Marketplaces menu. */
  hint?: string;
}

/** The places to find a property, grouped so the bar stays on one line. */
const MARKETPLACE_LINKS: NavLink[] = [
  { label: 'Rent', href: '/rent', hint: 'Homes to rent' },
  { label: 'Buy', href: '/buy', hint: 'Homes for sale' },
  { label: 'Land', href: ROUTES.LAND_MARKETPLACE, hint: 'Verified land listings' },
  { label: 'Shortlets', href: ROUTES.SHORTLET_MARKETPLACE, hint: 'Short stays' },
  {
    label: 'Estates',
    href: ESTATE_MARKETPLACE_ROUTES.ESTATES_DIRECTORY,
    hint: 'Gated communities',
  },
];

// The two in-page anchors are written as `/#…` so they work from every page that
// shows this bar, not only from the landing page.
const PAGE_LINKS: NavLink[] = [
  { label: 'Home Management', href: ROUTES.HOME_MANAGEMENT },
  { label: 'Roles', href: '/#roles' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: ROUTES.PRICING },
];

/** Every item is a single, unbreakable line; nothing is allowed to shrink or wrap. */
const linkBase =
  'inline-flex shrink-0 items-center whitespace-nowrap rounded-lg px-1 py-1 text-sm font-medium transition-colors';
const linkIdle = 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white';
const linkActive = 'text-primary';

const isCurrent = (pathname: string, href: string) => !href.includes('#') && pathname === href;

export const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSignedIn = useAuthStore((s) => s.isAuthenticated);
  // Computed client-side only (localStorage is unavailable on the server).
  // The Dashboard link only renders once the reactive auth store flips to
  // signed-in — after hydration — so there is no SSR/client mismatch.
  const [dashboardHref] = useState<string>(() =>
    typeof window === 'undefined' ? ROUTES.DASHBOARD : getDashboardRoute(getUserRole() || 'renter')
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    // Sync auth state from storage into the reactive store on first paint.
    useAuthStore.getState().init();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const signOut = async () => {
    await useAuthStore.getState().logout();
    router.push(ROUTES.HOME);
  };

  const marketplaceActive = MARKETPLACE_LINKS.some((link) => isCurrent(pathname, link.href));
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav
        aria-label="Main"
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-border/60 bg-white/80 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-white/65 dark:bg-background/80 dark:supports-backdrop-filter:bg-background/70'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6">
            <div className="shrink-0">
              <Logo />
            </div>

            {/* Links: one row, centred between the logo and the account actions. */}
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-5 lg:flex xl:gap-7">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`${linkBase} gap-1 group ${marketplaceActive ? linkActive : linkIdle}`}
                >
                  Marketplaces
                  <ChevronDown
                    className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  {MARKETPLACE_LINKS.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={link.href}
                        aria-current={isCurrent(pathname, link.href) ? 'page' : undefined}
                      >
                        <span className="flex flex-col">
                          <span className="font-medium">{link.label}</span>
                          {link.hint && (
                            <span className="text-xs text-muted-foreground">{link.hint}</span>
                          )}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {PAGE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isCurrent(pathname, link.href) ? 'page' : undefined}
                  className={`${linkBase} ${isCurrent(pathname, link.href) ? linkActive : linkIdle}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Account actions, always together on the right. */}
            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              {!isSignedIn ? (
                <>
                  <Link href={ROUTES.LOGIN} className={`${linkBase} ${linkIdle}`}>
                    Sign in
                  </Link>
                  <ThemeToggle />
                  <Link
                    href={ROUTES.SIGNUP}
                    className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
                  >
                    Get early access
                  </Link>
                </>
              ) : (
                <>
                  <Link href={dashboardHref} className={`${linkBase} ${linkIdle}`}>
                    Dashboard
                  </Link>
                  <ThemeToggle />
                  <button
                    onClick={signOut}
                    className={`${linkBase} text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300`}
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3 lg:hidden">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
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
            className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border/60 bg-white/95 backdrop-blur-xl lg:hidden dark:bg-background/95"
          >
            <div className="flex flex-col gap-1 p-4">
              <p className="px-4 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Marketplaces
              </p>
              {MARKETPLACE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-2 h-px bg-border" />
              {PAGE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-2 h-px bg-border" />
              {!isSignedIn ? (
                <>
                  <Link
                    href={ROUTES.LOGIN}
                    onClick={closeMenu}
                    className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                  <Link
                    href={ROUTES.SIGNUP}
                    onClick={closeMenu}
                    className="mt-1 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover"
                  >
                    Get early access
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={closeMenu}
                    className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={signOut}
                    className="rounded-lg px-4 py-2 text-left text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
