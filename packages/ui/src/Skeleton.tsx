import { cn } from '@getrentos/shared';

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-muted via-secondary to-muted bg-[length:200%_100%]',
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
      className="overflow-hidden rounded-2xl border border-border bg-card"
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
