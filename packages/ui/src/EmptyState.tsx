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
      role="status"
      className={cn(
        'rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center',
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/60">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="font-semibold tracking-[-0.01em] text-foreground">{title}</p>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
