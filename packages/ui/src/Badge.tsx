import { ReactNode } from 'react';
import { cn } from '@sureground/shared';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'primary'
  | 'purple';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  title?: string;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-success-subtle text-success border-success/20 ring-success/10',
  warning: 'bg-warning-subtle text-warning border-warning/20 ring-warning/10',
  danger: 'bg-destructive-subtle text-destructive border-destructive/20 ring-destructive/10',
  neutral: 'bg-secondary text-foreground/75 border-border/70 ring-foreground/5',
  info: 'bg-info-subtle text-info border-info/20 ring-info/10',
  primary: 'bg-accent text-primary border-primary/20 ring-primary/10',
  purple: 'bg-purple-subtle text-purple border-purple/20 ring-purple/10',
};

export const Badge = ({ children, variant = 'neutral', icon, title, className }: BadgeProps) => {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium tracking-[-0.005em]',
        variants[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
};
