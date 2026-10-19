import { cn } from '@getrentos/shared';

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-lg bg-foreground/[0.07] motion-reduce:animate-none',
        className
      )}
    />
  );
};

export const PageLoadingState = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none"
      />
      <span className="sr-only">Loading page…</span>
    </div>
  );
};

export const TableSkeleton = ({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading table"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <span className="sr-only">Loading table…</span>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-6 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Placeholder for a stack of cards or list rows while a list loads. */
export const ListSkeleton = ({
  rows = 4,
  variant = 'rows',
  label = 'Loading',
  className,
}: {
  rows?: number;
  /** `rows`: avatar + two lines in one bordered list. `cards`: separate cards. */
  variant?: 'rows' | 'cards';
  label?: string;
  className?: string;
}) => (
  <div
    role="status"
    aria-live="polite"
    aria-label={label}
    className={cn(
      variant === 'rows'
        ? 'divide-y divide-border overflow-hidden rounded-xl border border-border bg-card'
        : 'space-y-3',
      className
    )}
  >
    <span className="sr-only">{label}…</span>
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className={cn(
          'flex items-center gap-4 p-4',
          variant === 'cards' && 'rounded-xl border border-border bg-card'
        )}
      >
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          {/* Varied widths read as text, not as a barcode. */}
          <Skeleton
            className={cn('h-3.5', index % 3 === 0 ? 'w-2/5' : index % 3 === 1 ? 'w-1/2' : 'w-1/3')}
          />
          <Skeleton className={cn('h-3', index % 2 === 0 ? 'w-3/5' : 'w-2/3')} />
        </div>
        <Skeleton className="hidden h-8 w-20 shrink-0 sm:block" />
      </div>
    ))}
  </div>
);

/** Placeholder for a row of stat cards. */
export const StatGridSkeleton = ({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading"
    className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}
  >
    <span className="sr-only">Loading…</span>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="space-y-3 rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    ))}
  </div>
);

/** Placeholder for a detail card: a heading and a few label/value lines. */
export const CardSkeleton = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading"
    className={cn('space-y-4 rounded-xl border border-border bg-card p-5', className)}
  >
    <span className="sr-only">Loading…</span>
    <Skeleton className="h-5 w-1/3" />
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-3.5', index === lines - 1 ? 'w-1/2' : 'w-full')} />
      ))}
    </div>
  </div>
);
