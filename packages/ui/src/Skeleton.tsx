import { cn } from '@sureground/shared';

// A span, not a div, so it is valid inside a paragraph or heading.
export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block animate-pulse rounded-lg bg-foreground/[0.07] motion-reduce:animate-none',
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
      className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6"
    >
      <span className="sr-only">Loading page…</span>
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-56 max-w-[70%]" />
        <Skeleton className="h-4 w-80 max-w-[90%]" />
      </div>
      <StatGroupFrame items={4} />
      <TableFrame rows={5} columns={4} />
    </div>
  );
};

// Shaped like DataTable: header band, wider first column, amounts on the right.
const TableFrame = ({ rows, columns }: { rows: number; columns: number }) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
    <div className="flex items-center gap-6 border-b border-border bg-secondary/40 px-5 py-3">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <Skeleton
          key={colIndex}
          className={cn('h-3', colIndex === 0 ? 'w-24 flex-[2]' : 'w-16 flex-1')}
        />
      ))}
    </div>
    <div className="divide-y divide-border/60">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-6 px-5 py-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={cn(
                'flex min-w-0',
                colIndex === 0 ? 'flex-[2]' : 'flex-1',
                colIndex === columns - 1 && columns > 1 && 'justify-end'
              )}
            >
              <Skeleton
                className={cn(
                  'h-3.5',
                  colIndex === 0 ? (rowIndex % 2 ? 'w-3/5' : 'w-4/5') : 'w-2/3'
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) => {
  return (
    <div role="status" aria-live="polite" aria-label="Loading table">
      <span className="sr-only">Loading table…</span>
      <TableFrame rows={rows} columns={columns} />
    </div>
  );
};

export const ListSkeleton = ({
  rows = 4,
  variant = 'rows',
  label = 'Loading',
  bare = false,
  className,
}: {
  rows?: number;
  variant?: 'rows' | 'cards';
  label?: string;
  bare?: boolean;
  className?: string;
}) => (
  <div
    role="status"
    aria-live="polite"
    aria-label={label}
    className={cn(
      variant === 'rows'
        ? cn(
            'divide-y divide-border',
            !bare && 'overflow-hidden rounded-xl border border-border bg-card'
          )
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

// Written out in full: Tailwind only generates classes it finds as literals.
const GROUP_COLUMNS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-3 lg:grid-cols-5',
  6: 'sm:grid-cols-3 lg:grid-cols-6',
};

const StatGroupFrame = ({ items }: { items: number }) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
    <div className="border-b border-border px-5 py-3.5">
      <Skeleton className="h-3.5 w-32" />
    </div>
    <div
      className={cn(
        'grid grid-cols-1 gap-px bg-border [&>*]:bg-card',
        GROUP_COLUMNS[Math.min(Math.max(items, 1), 6)]
      )}
    >
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="space-y-3 px-5 py-4">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ))}
    </div>
  </div>
);

/** Shaped like StatGroup panels; `groups` gives the number of figures in each panel. */
export const StatGroupSkeleton = ({
  groups = [4],
  className,
}: {
  groups?: number[];
  className?: string;
}) => (
  <div role="status" aria-live="polite" aria-label="Loading" className={cn('space-y-4', className)}>
    <span className="sr-only">Loading…</span>
    {groups.map((items, index) => (
      <StatGroupFrame key={index} items={items} />
    ))}
  </div>
);
