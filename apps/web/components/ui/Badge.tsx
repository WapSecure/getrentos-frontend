import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  warning: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  danger: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  neutral: 'text-muted-foreground bg-secondary',
  info: 'text-primary bg-accent',
};

export const Badge = ({ children, variant = 'neutral', icon, className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-current/10 px-2.5 py-1 text-xs font-medium tracking-[-0.01em]',
        variants[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
};
