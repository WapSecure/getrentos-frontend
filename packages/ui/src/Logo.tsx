'use client';

import Link from 'next/link';
import { cn } from '@sureground/shared';

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
        viewBox="0 0 128 128"
        aria-hidden="true"
        className={cn(
          'shrink-0 aspect-square text-primary transition-transform group-hover:scale-105',
          currentSize.mark
        )}
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M28 82 64 22l36 60" />
          <path d="M12 108h104" />
        </g>
      </svg>
      {showText && (
        <span
          className={cn(
            'font-extrabold tracking-[-0.025em] whitespace-nowrap text-foreground',
            currentSize.text
          )}
        >
          Sureground
        </span>
      )}
    </Link>
  );
};
