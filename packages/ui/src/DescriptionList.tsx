import type { ReactNode } from 'react';
import { cn } from '@getrentos/shared';

export interface DescriptionItem {
  label: ReactNode;
  value: ReactNode;
  /** Small text under the value. */
  hint?: ReactNode;
  /** Take the full row in a multi-column list (an address, a note). */
  wide?: boolean;
}

interface DescriptionListProps {
  items: readonly DescriptionItem[];
  /** `stacked`: label above value, in a grid. `rows`: label left, value right, one per line. */
  layout?: 'stacked' | 'rows';
  columns?: 1 | 2 | 3;
  /** Shown for a null, undefined or empty value, so a gap never looks like a bug. */
  emptyValue?: ReactNode;
  className?: string;
}

const COLUMNS = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' } as const;
const WIDE = { 1: '', 2: 'sm:col-span-2', 3: 'sm:col-span-2 lg:col-span-3' } as const;

const isEmpty = (value: ReactNode) => value === null || value === undefined || value === '';

/** Read-only facts about a record: label and value pairs. */
export function DescriptionList({
  items,
  layout = 'stacked',
  columns = 2,
  emptyValue = '—',
  className,
}: DescriptionListProps) {
  if (layout === 'rows') {
    return (
      <dl className={cn('divide-y divide-border', className)}>
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="min-w-0 text-sm font-medium text-foreground sm:text-right">
              <span className="break-words">{isEmpty(item.value) ? emptyValue : item.value}</span>
              {item.hint && (
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {item.hint}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4', COLUMNS[columns], className)}>
      {items.map((item, index) => (
        <div key={index} className={cn('min-w-0', item.wide && WIDE[columns])}>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm font-medium text-foreground">
            {isEmpty(item.value) ? (
              <span className="text-muted-foreground">{emptyValue}</span>
            ) : (
              item.value
            )}
          </dd>
          {item.hint && <dd className="mt-0.5 text-xs text-muted-foreground">{item.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
