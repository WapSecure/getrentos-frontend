import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/format';

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
  tone?: 'default' | 'brand';
  wrap?: boolean;
}

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
              'mt-0.5 text-sm tabular-nums',
              fact.wrap ? 'break-words' : 'truncate',
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
