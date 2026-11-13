import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from '@sureground/icons';
import { cn } from '@sureground/shared';

interface ArrowLinkProps {
  href: string;
  children: ReactNode;
  /** `brand` (default) is Sureground blue; `light` sits on a photo or a blue band. */
  tone?: 'brand' | 'light';
  className?: string;
}

/** Brik's text action: tracked capitals, an underline and a trailing arrow. */
export const ArrowLink = ({ href, children, tone = 'brand', className }: ArrowLinkProps) => (
  <Link
    href={href}
    className={cn(
      'label-caps group inline-flex items-center gap-3 rounded-xs border-b pb-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
      tone === 'brand'
        ? 'border-primary/40 text-primary hover:border-primary hover:text-primary-hover'
        : 'border-primary-foreground/60 text-primary-foreground hover:border-primary-foreground',
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
