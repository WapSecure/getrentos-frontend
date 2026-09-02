import { ReactNode } from 'react';
import { cn } from '@getrentos/shared';
import { TableSkeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string | undefined;
  isLoading?: boolean;
  emptyState?: ReactNode;
  /** Rendered inside the same card, below the rows (e.g. a Pagination control). */
  footer?: ReactNode;
  className?: string;
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
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-left">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/90"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {data.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors duration-150',
                  onRowClick && 'cursor-pointer hover:bg-secondary/60',
                  getRowClassName?.(row)
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-5 py-3.5 align-middle', column.className)}>
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
