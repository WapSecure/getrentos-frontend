import { ReactNode } from 'react';
import { cn } from '@getrentos/shared';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success:
    'text-green-700 bg-green-50 border-green-200/70 dark:text-green-400 dark:bg-green-900/20 dark:border-green-900',
  warning:
    'text-yellow-700 bg-yellow-50 border-yellow-200/70 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-900',
  danger:
    'text-red-700 bg-red-50 border-red-200/70 dark:text-red-400 dark:bg-red-900/20 dark:border-red-900',
  neutral: 'text-muted-foreground bg-secondary border-border/70',
  info: 'text-primary bg-accent border-primary/15',
};

export const Badge = ({ children, variant = 'neutral', icon, className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium tracking-[-0.01em] shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
        variants[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
};
