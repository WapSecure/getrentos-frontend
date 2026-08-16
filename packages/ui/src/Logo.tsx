'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeClasses = {
  sm: {
    container: 'w-6 h-6',
    icon: 'w-3 h-3',
    text: 'text-lg',
  },
  md: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-xl',
  },
  lg: {
    container: 'w-10 h-10',
    icon: 'w-5 h-5',
    text: 'text-2xl',
  },
};

export const Logo = ({ href = '/', className = '', size = 'md', showText = true }: LogoProps) => {
  const currentSize = sizeClasses[size];

  return (
    <Link href={href} className={`flex items-center gap-2 group ${className}`}>
      <div
        className={`${currentSize.container} bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}
      >
        <Shield className={`${currentSize.icon} text-background`} />
      </div>
      {showText && (
        <span
          className={`font-bold ${currentSize.text} text-foreground group-hover:text-primary transition-colors`}
        >
          GetRentos
        </span>
      )}
    </Link>
  );
};
