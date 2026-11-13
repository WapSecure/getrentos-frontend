import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/format';

/**
 * Shared presentation for the role list pages (tenants, applications, leases, leads, offers and
 * the like) so every record reads the same: a quiet card, a blue avatar or icon tile, two meta
 * lines, a key facts strip and a footer of actions. Presentation only; no data lives here.
 */

/** The card shell: warm neutral surface, a blue edge on hover, a stronger one when selected. */
export const recordCardClass = (selected = false) =>
  cn(
    'min-w-0 rounded-2xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow] duration-150 sm:p-5',
    selected
      ? 'border-primary shadow-[inset_0_0_0_1px_var(--primary)]'
      : 'border-border hover:border-primary/30 hover:shadow-sm'
  );

const avatarSizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
} as const;

/** Initials on a soft blue tile; the solid blue stays for primary actions. */
export function RecordAvatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: keyof typeof avatarSizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/15',
        avatarSizes[size],
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}

/** An icon on a soft blue tile, for records that are things rather than people. */
export function RecordIconTile({
  icon: Icon,
  size = 'md',
  className,
}: {
  icon: ElementType;
  size?: keyof typeof avatarSizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15',
        avatarSizes[size],
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </span>
  );
}

export interface RecordFact {
  label: string;
  value: ReactNode;
  /** `brand` sets the value in Sureground blue, for the one figure that matters most. */
  tone?: 'default' | 'brand';
}

/** A small inset grid of label and value pairs. */
export function RecordFacts({
  facts,
  columns = 2,
  className,
}: {
  facts: RecordFact[];
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'mt-4 grid gap-x-4 gap-y-3 rounded-xl bg-secondary/60 px-3.5 py-3',
        columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2',
        className
      )}
    >
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{fact.label}</dt>
          <dd
            className={cn(
              'mt-0.5 truncate text-sm tabular-nums',
              fact.tone === 'brand' ? 'font-semibold text-primary' : 'font-medium text-foreground'
            )}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The footer row of actions, divided from the body. */
export function RecordActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4',
        className
      )}
    >
      {children}
    </div>
  );
}

/** A loading placeholder shaped like a record card, for list pages that show cards. */
export function RecordCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(recordCardClass(), 'hover:border-border hover:shadow-xs', className)}>
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-secondary" />
        <div className="min-w-0 flex-1 space-y-2">
          <span className="block h-3.5 w-2/5 animate-pulse rounded bg-secondary" />
          <span className="block h-3 w-3/5 animate-pulse rounded bg-secondary" />
        </div>
      </div>
      <span className="mt-4 block h-14 animate-pulse rounded-xl bg-secondary/60" />
    </div>
  );
}

/** A grid of card placeholders, passed to ListState's `skeleton` while the first page loads. */
export function RecordGridSkeleton({
  count = 6,
  className = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <RecordCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** The search and filter bar above a list, set on its own card so it reads as one control. */
export function RecordToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs sm:flex-row sm:items-center',
        className
      )}
    >
      {children}
    </div>
  );
}
