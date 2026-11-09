import { ReactNode } from 'react';
import { cn } from '@sureground/shared';
import { TableSkeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  /** Right-aligned with tabular figures, so amounts line up digit for digit. */
  numeric?: boolean;
  /** Visible header text is optional (an actions column); this still names it for screen readers. */
  srHeader?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string | undefined;
  isLoading?: boolean;
  emptyState?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Read by screen readers only: what the table lists. */
  caption?: string;
  density?: 'comfortable' | 'compact';
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  getRowClassName,
  isLoading = false,
  emptyState,
  footer,
  className,
  caption,
  density = 'comfortable',
}: DataTableProps<T>) {
  const cellY = density === 'compact' ? 'py-2.5' : 'py-3.5';
  if (isLoading) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-xs', className)}
    >
      <div className="overflow-x-auto" tabIndex={0}>
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-secondary/40 text-left backdrop-blur-sm">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-2.5 text-xs font-medium tracking-[0.01em] text-muted-foreground first:pl-5 last:pr-5',
                    column.align === 'center' && 'text-center',
                    (column.align === 'right' || column.numeric) && 'text-right'
                  )}
                >
                  {column.header ||
                    (column.srHeader && <span className="sr-only">{column.srHeader}</span>)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'transition-colors duration-150 hover:bg-secondary/40',
                  onRowClick &&
                    'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  getRowClassName?.(row)
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 align-middle first:pl-5 last:pr-5',
                      cellY,
                      column.align === 'center' && 'text-center',
                      (column.align === 'right' || column.numeric) && 'text-right tabular-nums',
                      column.className
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
