'use client';

import type { ReactNode } from 'react';
import { ToggleChip } from '@sureground/ui';
import { cn } from '@sureground/shared';

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** A single-choice row of filter chips; the pressed chip is the active filter. */
export function FilterChips<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: FilterChipOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1', className)}
    >
      {options.map((option) => (
        <ToggleChip
          key={option.value}
          size="sm"
          pressed={value === option.value}
          onPressedChange={() => onChange(option.value)}
          count={option.count}
        >
          {option.label}
        </ToggleChip>
      ))}
    </div>
  );
}

/** The search and filter controls above a queue, framed as one bar. */
export function OpsToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:flex-row sm:flex-wrap sm:items-center',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface Fact {
  label: string;
  value: ReactNode;
  /** Spans the full row, for long values such as references. */
  wide?: boolean;
  mono?: boolean;
}

/** Key facts of a record as a label-over-value grid. */
export function FactGrid({
  facts,
  columns = 2,
  className,
}: {
  facts: (Fact | false | null | undefined)[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const shown = facts.filter((fact): fact is Fact => Boolean(fact));
  if (shown.length === 0) return null;
  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-3 text-sm',
        columns === 3 && 'sm:grid-cols-3',
        columns === 4 && 'sm:grid-cols-4',
        className
      )}
    >
      {shown.map((fact) => (
        <div key={fact.label} className={cn('min-w-0', fact.wide && 'col-span-full')}>
          <dt className="text-xs text-muted-foreground">{fact.label}</dt>
          <dd
            className={cn(
              'mt-0.5 font-medium text-foreground [overflow-wrap:anywhere]',
              fact.mono && 'font-mono text-xs'
            )}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A tinted square holding a record's icon, in brand blue unless a risk tone is given. */
export function IconTile({
  children,
  tone = 'primary',
  size = 'md',
}: {
  children: ReactNode;
  tone?: 'primary' | 'danger' | 'warning' | 'success' | 'neutral';
  size?: 'sm' | 'md';
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg',
        size === 'sm'
          ? 'h-8 w-8 [&>svg]:h-4 [&>svg]:w-4'
          : 'h-10 w-10 [&>svg]:h-[18px] [&>svg]:w-[18px]',
        tone === 'primary' && 'bg-primary/10 text-primary',
        tone === 'danger' && 'bg-destructive-subtle text-destructive',
        tone === 'warning' && 'bg-warning-subtle text-warning',
        tone === 'success' && 'bg-success-subtle text-success',
        tone === 'neutral' && 'bg-secondary text-muted-foreground'
      )}
    >
      {children}
    </span>
  );
}
