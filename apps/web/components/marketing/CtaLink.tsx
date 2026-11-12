import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from '@sureground/icons';
import { cn } from '@sureground/shared';

interface CtaLinkProps {
  href: string;
  children: ReactNode;
  variant?: 'ink' | 'outline' | 'light' | 'outline-light';
  arrow?: boolean;
  className?: string;
}

const VARIANTS = {
  ink: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  outline: 'border border-foreground/70 text-foreground hover:bg-foreground hover:text-background',
  // For use on a `bg-primary` band: they invert with it in either theme.
  light: 'bg-primary-foreground text-primary hover:bg-primary-foreground/90',
  'outline-light':
    'border border-primary-foreground/70 text-primary-foreground hover:bg-primary-foreground hover:text-primary',
} as const;

/** A link styled as a Brik button: sharp, 48px tall, tracked capitals. Server-rendered, no JS. */
export const CtaLink = ({
  href,
  children,
  variant = 'ink',
  arrow = false,
  className,
}: CtaLinkProps) => (
  <Link
    href={href}
    className={cn(
      'label-caps group inline-flex min-h-12 items-center justify-center gap-3 rounded-md px-6 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
      VARIANTS[variant],
      className
    )}
  >
    {children}
    {arrow ? (
      <ArrowRight
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
        aria-hidden="true"
      />
    ) : null}
  </Link>
);
