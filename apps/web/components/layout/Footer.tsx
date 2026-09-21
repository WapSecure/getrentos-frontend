import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Twitter, Mail, MapPin } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { SITE_NAME, SITE_TWITTER_HANDLE } from '@/lib/site';

const linkClass =
  'text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground';
const headingClass = 'mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground';

const productLinks = [
  { label: 'Rent', href: '/rent' },
  { label: 'Buy', href: '/buy' },
  { label: 'Shortlet stays', href: ROUTES.SHORTLET_MARKETPLACE },
  { label: 'Buy land', href: ROUTES.LAND_MARKETPLACE },
  { label: 'Home management', href: ROUTES.HOME_MANAGEMENT },
  { label: 'Pricing', href: ROUTES.PRICING },
  { label: 'How it works', href: '/#how-it-works' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Data protection', href: '/privacy#your-rights' },
];

export const Footer = () => (
  <footer className="relative overflow-hidden border-t border-border bg-linear-to-br from-white to-secondary/50 dark:from-card dark:to-muted">
    <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo size="md" />
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            The trust-driven property operating system. One workspace for renters, landlords,
            owners, buyers, realtors and agents.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href={`https://x.com/${SITE_TWITTER_HANDLE.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE_NAME} on X`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-all hover:bg-primary hover:text-white dark:bg-white/10 dark:text-gray-400"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className={headingClass}>Product</h3>
          <ul className="space-y-2.5">
            {productLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={headingClass}>Get started</h3>
          <ul className="space-y-2.5">
            <li>
              <Link href={ROUTES.SIGNUP} className={linkClass}>
                Create an account
              </Link>
            </li>
            <li>
              <Link href={ROUTES.LOGIN} className={linkClass}>
                Sign in
              </Link>
            </li>
            <li>
              <Link href={ROUTES.ROLE_SELECTION} className={linkClass}>
                Browse roles
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className={headingClass}>Contact</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <a
                href="mailto:support@getrentos.com"
                className="transition-colors duration-200 hover:text-foreground"
              >
                support@getrentos.com
              </a>
            </li>
            <li className="flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span>Lagos, Nigeria</span>
            </li>
            <li>
              <a
                href="mailto:support@getrentos.com?subject=Help%20request"
                className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                Get support
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="my-8 border-t border-border" />

      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-6 text-sm">
          {legalLinks.map((item) => (
            <Link key={item.label} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);
