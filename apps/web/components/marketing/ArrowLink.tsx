import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from '@sureground/icons';
import { cn } from '@sureground/shared';

interface ArrowLinkProps {
  href: string;
  children: ReactNode;
  tone?: 'ink' | 'light';
  className?: string;
}

/** Brik's text action: tracked capitals, an underline and a trailing arrow. */
export const ArrowLink = ({ href, children, tone = 'ink', className }: ArrowLinkProps) => (
  <Link
    href={href}
    className={cn(
      'label-caps group inline-flex items-center gap-3 border-b pb-1.5 transition-colors',
      tone === 'ink'
        ? 'border-foreground/40 text-foreground hover:border-foreground'
        : 'border-white/50 text-white hover:border-white',
      className
    )}
  >
    {children}
    <ArrowRight
      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
      aria-hidden="true"
    />
  </Link>
);
