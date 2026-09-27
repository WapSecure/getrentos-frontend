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
        <path
          d="M18 122 64 24l46 98"
          fill="none"
          stroke="currentColor"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M64 122V96"
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
        />
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
