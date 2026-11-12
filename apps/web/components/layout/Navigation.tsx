'use client';

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@sureground/ui/DropdownMenu';
import { cn } from '@sureground/shared';
import { ChevronDown, Search, X } from '@sureground/icons';
import { ThemeSwitch } from '@/components/layout/ThemeSwitch';
import { Logo } from '@/components/ui/Logo';
import { CtaLink } from '@/components/marketing/CtaLink';
import { ROUTES, getDashboardRoute, getUserRole } from '@/lib/constants/auth';
import { ESTATE_MARKETPLACE_ROUTES } from '@/lib/constants/auth';
import { useAuthStore } from '@/lib/store/authStore';
import { useLandAvailability } from '@/hooks/useLandAvailability';
import { useDiasporaAvailability } from '@/hooks/useDiasporaAvailability';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';

interface NavLink {
  label: string;
  href: string;
  hint?: string;
}

const FIND_LINKS: NavLink[] = [
  { label: 'Buy', href: '/buy', hint: 'Homes for sale' },
  { label: 'Rent', href: '/rent', hint: 'Homes to rent' },
  {
    label: 'Short stays',
    href: ROUTES.SHORTLET_MARKETPLACE,
    hint: 'Serviced apartments by the night',
  },
  { label: 'Land', href: ROUTES.LAND_MARKETPLACE, hint: 'Plots with title checks' },
  { label: 'Off-plan', href: '/developments', hint: 'New developments checked by our staff' },
];

const MORE_LINKS: NavLink[] = [
  { label: 'Sell', href: '/sell', hint: 'List a home or land for sale' },
  { label: 'Let', href: '/landlords', hint: 'For landlords and property managers' },
  {
    label: 'Estates',
    href: ESTATE_MARKETPLACE_ROUTES.ESTATES_DIRECTORY,
    hint: 'Gated communities',
  },
  { label: 'Detty December', href: '/detty-december', hint: 'Peak-season stays, Dec 20 – Jan 3' },
  { label: 'Property management', href: ROUTES.HOME_MANAGEMENT, hint: 'For landlords and owners' },
  { label: 'Realtors and agencies', href: '/agents', hint: 'Listings, leads and commissions' },
  { label: 'Pricing', href: ROUTES.PRICING, hint: 'Free and Pro plans' },
  { label: 'About', href: '/about', hint: 'Who we are and how to reach us' },
];

const DIASPORA_LINK: NavLink = {
  label: 'Diaspora Invest',
  href: DIASPORA_ROUTES.PUBLIC,
  hint: 'Buy and manage from abroad',
};

const navLink =
  'label-caps inline-flex h-10 items-center whitespace-nowrap px-1 text-foreground/80 transition-colors hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:underline-offset-8';

const isCurrent = (pathname: string, href: string) => pathname === href;

const FOCUSABLE = 'a[href], button:not([disabled])';

export const Navigation = () => {
  const land = useLandAvailability();
  const diaspora = useDiasporaAvailability();
  const findLinks = land.marketplace
    ? FIND_LINKS
    : FIND_LINKS.filter((link) => link.href !== ROUTES.LAND_MARKETPLACE);
  const moreLinks = diaspora.enabled ? [DIASPORA_LINK, ...MORE_LINKS] : MORE_LINKS;

  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // The menu belongs to the page it was opened on, so navigating closes it without an effect.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const isSignedIn = useAuthStore((s) => s.isAuthenticated);
  const [dashboardHref] = useState<string>(() =>
    typeof window === 'undefined' ? ROUTES.DASHBOARD : getDashboardRoute(getUserRole() || 'renter')
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    useAuthStore.getState().init();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuPath(null);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Keeps Tab inside the open menu and its toggle.
  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !panel.current) return;
    const items = [
      menuButton.current,
      ...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ].filter(Boolean) as HTMLElement[];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const signOut = async () => {
    await useAuthStore.getState().logout();
    router.push(ROUTES.HOME);
  };

  const moreActive = moreLinks.some((link) => isCurrent(pathname, link.href));

  return (
    <>
      <nav
        aria-label="Main"
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b bg-background/95 transition-[border-color] duration-200 supports-backdrop-filter:bg-background/85 supports-backdrop-filter:backdrop-blur-xl',
          scrolled || menuOpen ? 'border-border' : 'border-transparent'
        )}
      >
        <div className="mx-auto grid h-16 max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-5 xl:gap-7">
            <button
              ref={menuButton}
              type="button"
              onClick={() => setMenuPath(menuOpen ? null : pathname)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="label-caps -ml-2 inline-flex h-10 items-center gap-2.5 px-2 lg:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
                  <span className="h-px w-full bg-current" />
                  <span className="h-px w-full bg-current" />
                </span>
              )}
              {menuOpen ? 'Close' : 'Menu'}
            </button>
            <div className="hidden items-center gap-5 lg:flex xl:gap-7">
              {findLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isCurrent(pathname, link.href) ? 'page' : undefined}
                  className={navLink}
                >
                  {link.label}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(navLink, 'group gap-1.5', moreActive && 'text-foreground')}
                >
                  More
                  <ChevronDown
                    className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {moreLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link
                        href={link.href}
                        aria-current={isCurrent(pathname, link.href) ? 'page' : undefined}
                      >
                        <span className="flex flex-col">
                          <span className="font-medium">{link.label}</span>
                          {link.hint ? (
                            <span className="text-xs text-muted-foreground">{link.hint}</span>
                          ) : null}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Logo size="sm" />

          <div className="flex items-center justify-end gap-2 lg:gap-4">
            <div className="hidden items-center gap-4 lg:flex">
              {!isSignedIn ? (
                <>
                  <Link href={ROUTES.LOGIN} className={navLink}>
                    Sign in
                  </Link>
                  <ThemeSwitch />
                  <CtaLink href={ROUTES.SIGNUP} className="min-h-10 px-5">
                    Get started
                  </CtaLink>
                </>
              ) : (
                <>
                  <Link href={dashboardHref} className={navLink}>
                    Dashboard
                  </Link>
                  <ThemeSwitch />
                  <button
                    type="button"
                    onClick={signOut}
                    className={cn(navLink, 'text-destructive hover:text-destructive')}
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
            <Link
              href="/rent"
              aria-label="Search homes"
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center lg:hidden"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>

      {menuOpen ? (
        <div
          id="site-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          onKeyDown={trapFocus}
          className="sheet-in fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-background lg:hidden"
        >
          <div className="mx-auto flex min-h-full max-w-[1240px] flex-col px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6">
            <p className="label-caps mb-2 text-muted-foreground">Find</p>
            <ul className="mb-8 border-t border-border">
              {findLinks.map((link) => (
                <li key={link.href} className="border-b border-border">
                  <Link
                    href={link.href}
                    aria-current={isCurrent(pathname, link.href) ? 'page' : undefined}
                    className="font-display flex min-h-14 items-center justify-between text-[1.625rem] font-normal"
                  >
                    {link.label}
                    <span className="hidden font-sans text-sm text-muted-foreground sm:inline">
                      {link.hint}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="label-caps mb-2 text-muted-foreground">More</p>
            <ul className="mb-8 border-t border-border">
              {moreLinks.map((link) => (
                <li key={link.href} className="border-b border-border">
                  <Link
                    href={link.href}
                    aria-current={isCurrent(pathname, link.href) ? 'page' : undefined}
                    className="flex min-h-12 items-center text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="label-caps text-muted-foreground">Appearance</span>
                <ThemeSwitch />
              </div>
              {!isSignedIn ? (
                <div className="grid grid-cols-2 gap-3">
                  <CtaLink href={ROUTES.LOGIN} variant="outline">
                    Sign in
                  </CtaLink>
                  <CtaLink href={ROUTES.SIGNUP}>Get started</CtaLink>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <CtaLink href={dashboardHref} variant="outline">
                    Dashboard
                  </CtaLink>
                  <button
                    type="button"
                    onClick={signOut}
                    className="label-caps min-h-12 rounded-md border border-destructive/60 text-destructive"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
