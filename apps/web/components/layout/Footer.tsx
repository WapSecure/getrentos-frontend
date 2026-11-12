import Link from 'next/link';
import { IconLink } from '@sureground/ui/IconButton';
import { Logo } from '@/components/ui/Logo';
import { Twitter } from '@sureground/icons';
import { SUPPORT, whatsappLink } from '@/lib/support';
import { ROUTES, ESTATE_MARKETPLACE_ROUTES } from '@/lib/constants/auth';
import { SITE_NAME, SITE_TWITTER_HANDLE } from '@/lib/site';

const linkClass = 'text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Find',
    links: [
      { label: 'Homes for sale', href: '/buy' },
      { label: 'Homes to rent', href: '/rent' },
      { label: 'Short stays', href: ROUTES.SHORTLET_MARKETPLACE },
      { label: 'Land', href: ROUTES.LAND_MARKETPLACE },
      { label: 'Off-plan developments', href: '/developments' },
      { label: 'Estates', href: ESTATE_MARKETPLACE_ROUTES.ESTATES_DIRECTORY },
      { label: 'Detty December', href: '/detty-december' },
      { label: 'Renting a home', href: '/renters' },
      { label: 'Buying property', href: '/buyers' },
    ],
  },
  {
    title: 'Own and manage',
    links: [
      { label: 'Sell a property', href: '/sell' },
      { label: 'Let a property', href: '/landlords' },
      { label: 'Property management', href: ROUTES.HOME_MANAGEMENT },
      { label: 'Realtors and agencies', href: '/agents' },
      { label: 'Pricing', href: ROUTES.PRICING },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Guides', href: '/resources' },
      { label: 'Create an account', href: ROUTES.SIGNUP },
      { label: 'Sign in', href: ROUTES.LOGIN },
    ],
  },
];

const LEGAL = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Cookies', href: '/cookies' },
  { label: 'Data protection', href: '/privacy#your-rights' },
];

export const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="mx-auto max-w-[1240px] px-4 pt-16 pb-10 sm:px-6 lg:px-10">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        <div className="max-w-sm">
          <Logo size="sm" />
          <p className="font-display mt-6 text-[1.625rem] leading-snug font-light">
            Property in Nigeria, checked before you commit.
          </p>
          <IconLink
            href={`https://x.com/${SITE_TWITTER_HANDLE.replace('@', '')}`}
            target="_blank"
            label={`${SITE_NAME} on X`}
            icon={<Twitter />}
            variant="secondary"
            size="sm"
            className="mt-6"
          />
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="label-caps mb-5 text-muted-foreground">{column.title}</h2>
            <ul className="flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="label-caps mb-5 text-muted-foreground">Contact</h2>
          <ul className="flex flex-col gap-3 text-[0.9375rem] text-muted-foreground">
            <li>
              <a href={`mailto:${SUPPORT.email}`} className="hover:text-foreground">
                {SUPPORT.email}
              </a>
            </li>
            {SUPPORT.phone ? (
              <li>
                <a
                  href={`tel:${SUPPORT.phone.replace(/\s/g, '')}`}
                  className="hover:text-foreground"
                >
                  {SUPPORT.phone}
                </a>
              </li>
            ) : null}
            {SUPPORT.whatsapp ? (
              <li>
                <a
                  href={whatsappLink(SUPPORT.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground"
                >
                  WhatsApp support
                </a>
              </li>
            ) : null}
            {SUPPORT.hours && (SUPPORT.phone || SUPPORT.whatsapp) ? (
              <li className="text-sm">{SUPPORT.hours}</li>
            ) : null}
            <li>Lagos, Nigeria</li>
            <li>
              <Link href="/about" className="hover:text-foreground">
                About Sureground
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="label-caps text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="label-caps text-muted-foreground">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </div>
  </footer>
);
