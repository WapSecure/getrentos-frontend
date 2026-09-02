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
    'bg-green-50 text-green-700 border-green-200/70 ring-green-600/10 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/60 dark:ring-green-400/10',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200/70 ring-amber-600/10 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 dark:ring-amber-400/10',
  danger:
    'bg-red-50 text-red-700 border-red-200/70 ring-red-600/10 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60 dark:ring-red-400/10',
  neutral: 'bg-secondary text-muted-foreground border-border/70 ring-foreground/5',
  info: 'bg-accent text-accent-foreground border-primary/15 ring-primary/10',
};

export const Badge = ({ children, variant = 'neutral', icon, className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium tracking-[-0.01em] ring-1 ring-inset',
        variants[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
};
