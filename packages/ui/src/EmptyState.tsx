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
        'rounded-2xl border border-border bg-card p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className
      )}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium tracking-[-0.01em] text-foreground">{title}</p>
      {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
