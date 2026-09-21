import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Landing-page building blocks. Plain markup and CSS only: the shared UI
 * SectionHeader and Card fade in from opacity 0 with JavaScript, which leaves the
 * server-rendered text invisible until scripts run and drags an animation
 * library into a page that otherwise needs none.
 */

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

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]';
const buttonVariants = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md active:shadow-sm',
  secondary:
    'bg-secondary text-secondary-foreground border border-border/70 shadow-xs hover:bg-foreground/[0.05] hover:border-border',
};
const buttonSizes = { md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

/**
 * A link that looks like the shared Button. The shared Button animates with
 * framer-motion, which would put that library on every landing-page load for the
 * sake of a hover effect.
 */
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
