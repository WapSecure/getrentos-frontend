import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@getrentos/shared';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/90 bg-card px-6 py-12 text-center shadow-sm',
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/70 ring-1 ring-inset ring-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <p className="font-semibold tracking-[-0.01em] text-foreground">{title}</p>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
