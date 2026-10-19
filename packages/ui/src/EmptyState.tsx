import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@getrentos/shared';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** A quieter second action, e.g. "Learn more" beside "Add a property". */
  secondaryAction?: ReactNode;
  /** `compact` sits inside a card or panel; `default` fills a page section. */
  size?: 'default' | 'compact';
  /** Drop the dashed frame when the parent already draws one. */
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
        !bare && 'rounded-xl border border-dashed border-border bg-card',
        compact ? 'px-5 py-8' : 'px-6 py-12',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto flex items-center justify-center rounded-lg border border-border bg-secondary/60',
          compact ? 'mb-3 h-9 w-9' : 'mb-4 h-10 w-10'
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
