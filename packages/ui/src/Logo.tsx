'use client';

import Link from 'next/link';
import { cn } from '@getrentos/shared';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeClasses = {
  sm: { mark: 'h-5', text: 'text-lg' },
  md: { mark: 'h-6', text: 'text-xl' },
  lg: { mark: 'h-9', text: 'text-2xl' },
} as const;

/** Official GetRentos mark geometry (roof/G + trust form). Filled with the
 *  current text color so it follows the app palette in both themes. */
const MARK_PATH =
  'M16 44 64 14 112 44 112 70 96 70 96 53 64 33 32 53 32 91 64 110 88 96 88 79 68 79 68 63 104 63 104 105 64 129 16 100Z';

export const Logo = ({ href = '/', className = '', size = 'md', showText = true }: LogoProps) => {
  const currentSize = sizeClasses[size];

  return (
    <Link href={href} className={cn('group flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 128 144"
        aria-hidden="true"
        className={cn(
          'shrink-0 aspect-[8/9] text-primary transition-transform group-hover:scale-105',
          currentSize.mark
        )}
      >
        <path d={MARK_PATH} fill="currentColor" />
      </svg>
      {showText && (
        <span className={cn('font-bold tracking-tight whitespace-nowrap', currentSize.text)}>
          <span className="text-foreground transition-colors group-hover:text-primary">Get</span>
          <span className="text-primary">Rentos</span>
        </span>
      )}
    </Link>
  );
};
