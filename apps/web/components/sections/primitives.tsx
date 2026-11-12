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
    {badge && <p className="label-caps mb-5 text-muted-foreground">{badge}</p>}
    <h2 className="font-display mx-auto max-w-3xl text-[2rem] leading-[1.1] font-normal tracking-[-0.01em] text-balance text-foreground md:text-[2.75rem]">
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
    className={`overflow-hidden rounded-lg border border-border bg-card transition-colors duration-200 hover:border-foreground/30 ${className}`}
  >
    {children}
  </div>
);

const iconTileSizes = {
  md: { tile: 'h-10 w-10 rounded-md', icon: 'h-5 w-5' },
  lg: { tile: 'h-12 w-12 rounded-md', icon: 'h-6 w-6' },
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
    <Icon className={`${iconTileSizes[size].icon} text-foreground`} aria-hidden="true" />
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
  <ul className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-3 ${className}`}>
    {items.map((item) => (
      <li
        key={item.text}
        className="label-caps inline-flex items-center gap-2 text-muted-foreground"
      >
        <item.icon className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
        {item.text}
      </li>
    ))}
  </ul>
);

const buttonBase =
  'label-caps inline-flex min-h-12 items-center justify-center gap-3 whitespace-nowrap rounded-md transition-colors duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary:
    'border border-foreground/70 text-foreground hover:bg-foreground hover:text-background',
};
const buttonSizes = { md: 'px-5', lg: 'px-7' };

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
