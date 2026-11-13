import { Fragment, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@sureground/shared';
import { TableSkeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  /** Usually text; a node allows a select-all checkbox. */
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
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
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T, index: number) => string | undefined;
  /** Extra attributes for a row, such as aria-current on the next instalment. */
  getRowProps?: (row: T, index: number) => HTMLAttributes<HTMLTableRowElement>;
  /** Tints the row in brand blue and marks it `data-state="selected"`; pair with a checkbox that says so. */
  isRowSelected?: (row: T, index: number) => boolean;
  /** A full-width panel under the row (payment history, line items); return null to show none. */
  renderExpanded?: (row: T, index: number) => ReactNode;
  /** A totals row aligned under its columns, keyed by column key. */
  totals?: Partial<Record<string, ReactNode>>;
  isLoading?: boolean;
  emptyState?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Read by screen readers only: what the table lists. */
  caption?: string;
  density?: 'comfortable' | 'compact';
  /** Below this width the table scrolls sideways instead of squeezing its columns. */
  minWidth?: string;
  /** `bare` sits inside a Card that already draws the frame. */
  variant?: 'card' | 'bare';
  /**
   * Caps the table's height (any CSS length) and scrolls its body inside the frame, so the
   * header row stays in view on a long list. Left out, the table grows with its rows.
   */
  maxHeight?: string;
}

const alignClass = (column: { align?: string; numeric?: boolean }) =>
  cn(
    column.align === 'center' && 'text-center',
    (column.align === 'right' || column.numeric) && 'text-right tabular-nums'
  );

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  getRowClassName,
  getRowProps,
  isRowSelected,
  renderExpanded,
  totals,
  isLoading = false,
  emptyState,
  footer,
  className,
  caption,
  density = 'comfortable',
  minWidth,
  variant = 'card',
  maxHeight,
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
      className={cn(
        variant === 'card' && 'overflow-hidden rounded-xl border border-border bg-card shadow-xs',
        className
      )}
    >
      <div
        className={maxHeight ? 'overflow-auto overscroll-contain' : 'overflow-x-auto'}
        style={maxHeight ? { maxHeight } : undefined}
        tabIndex={0}
      >
        <table className="w-full text-sm" style={minWidth ? { minWidth } : undefined}>
          {caption && <caption className="sr-only">{caption}</caption>}
          {/* Opaque under the tinted row when the body scrolls beneath it. */}
          <thead className={cn('sticky top-0 z-10', maxHeight && 'bg-card')}>
            <tr className="border-b border-border bg-secondary/40 text-left backdrop-blur-sm">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
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
            {data.map((row, index) => {
              const expanded = renderExpanded?.(row, index);
              const selected = isRowSelected?.(row, index) ?? false;
              return (
                <Fragment key={getRowKey(row, index)}>
                  <tr
                    {...getRowProps?.(row, index)}
                    {...(selected ? { 'data-state': 'selected' } : {})}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            // Only the row itself: Space on a button inside it must not open the row too.
                            if (event.target !== event.currentTarget) return;
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      'transition-colors duration-150 hover:bg-secondary/40',
                      'data-[state=selected]:bg-primary/[0.06] data-[state=selected]:hover:bg-primary/10 data-[state=selected]:[&>td:first-child]:shadow-[inset_2px_0_0_var(--primary)]',
                      onRowClick &&
                        'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                      getRowClassName?.(row, index)
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 align-middle first:pl-5 last:pr-5',
                          cellY,
                          alignClass(column),
                          column.className
                        )}
                      >
                        {column.render(row, index)}
                      </td>
                    ))}
                  </tr>
                  {expanded ? (
                    <tr className="bg-secondary/20">
                      <td colSpan={columns.length} className="px-5 py-4">
                        {expanded}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="border-t border-border bg-secondary/30 font-semibold text-foreground">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 first:pl-5 last:pr-5', cellY, alignClass(column))}
                  >
                    {totals[column.key] ?? null}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {footer}
    </div>
  );
}
