import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SgIcon } from '@sureground/icons';

// Plain markup and CSS: the shared SectionHeader and Card fade in with JavaScript, leaving server-rendered text invisible until scripts run.

export const SectionHeading = ({
  badge,
  title,
  description,
}: {
  badge?: string;
  title: string;
  description?: string;
}) => (
  <div className="mb-12 text-center">
    {badge && (
      <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-accent-foreground">
        {badge}
      </div>
    )}
    <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl lg:text-5xl">
      {title}
    </h2>
    {description && (
      <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
        {description}
      </p>
    )}
  </div>
);

export const MarketingCard = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${className}`}
  >
    {children}
  </div>
);

const iconTileSizes = {
  md: { tile: 'h-10 w-10 rounded-lg', icon: 'h-5 w-5' },
  lg: { tile: 'h-12 w-12 rounded-xl', icon: 'h-6 w-6' },
};

/** The tinted square that holds a card's icon. Spacing (mb-*, mx-auto) comes from the caller. */
export const MarketingIconTile = ({
  icon: Icon,
  size = 'md',
  className = '',
}: {
  icon: SgIcon;
  size?: keyof typeof iconTileSizes;
  className?: string;
}) => (
  <div
    className={`flex items-center justify-center bg-secondary ${iconTileSizes[size].tile} ${className}`}
  >
    <Icon className={`${iconTileSizes[size].icon} text-primary`} aria-hidden="true" />
  </div>
);

/** A row of short proof points under a hero: facts the product does today, never figures. */
export const TrustStrip = ({
  items,
  className = '',
}: {
  items: readonly { icon: SgIcon; text: string }[];
  className?: string;
}) => (
  <ul className={`flex flex-wrap items-center justify-center gap-2.5 ${className}`}>
    {items.map((item) => (
      <li
        key={item.text}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur"
      >
        <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {item.text}
      </li>
    ))}
  </ul>
);

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]';
const buttonVariants = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md active:shadow-sm',
  secondary:
    'bg-secondary text-secondary-foreground border border-border/70 shadow-xs hover:bg-foreground/[0.05] hover:border-border',
};
const buttonSizes = { md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

/** Not the shared Button, which would load framer-motion on every landing page for a hover effect. */
export const LinkButton = ({
  href,
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  className?: string;
  children: ReactNode;
}) => (
  <Link
    href={href}
    className={`${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
  >
    {children}
  </Link>
);
