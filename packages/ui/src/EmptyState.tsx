import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@sureground/shared';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  size?: 'default' | 'compact';
  bare?: boolean;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'default',
  bare = false,
  className,
}: EmptyStateProps) => {
  const compact = size === 'compact';
  return (
    <div
      role="status"
      className={cn(
        'text-center',
        !bare && 'rounded-xl border border-border bg-card',
        compact ? 'px-5 py-8' : 'px-6 py-16',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto flex items-center justify-center rounded-xl bg-secondary',
          compact ? 'mb-4 h-10 w-10' : 'mb-5 h-14 w-14'
        )}
      >
        <Icon
          className={cn('text-muted-foreground', compact ? 'h-4 w-4' : 'h-5 w-5')}
          aria-hidden="true"
        />
      </div>
      <p className={cn('font-semibold tracking-[-0.01em] text-foreground', compact && 'text-sm')}>
        {title}
      </p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-center gap-2',
            compact ? 'mt-4' : 'mt-5'
          )}
        >
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
