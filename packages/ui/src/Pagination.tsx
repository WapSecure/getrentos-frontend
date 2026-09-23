'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@getrentos/shared';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /**
   * True while the count is still unknown — normally React Query's `isPending`,
   * not `isLoading`: `isPending` is also true during SSR and the hydration gap,
   * which is exactly when `total` is still 0 for want of an answer.
   *
   * Without it a list that passes `total={data?.total ?? 0}` announces
   * "No results" underneath its own loading skeletons, and a slow request looks
   * like an empty one.
   */
  isLoading?: boolean;
  className?: string;
}

export const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  isLoading = false,
  className,
}: PaginationProps) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const summary = isLoading
    ? 'Loading…'
    : total === 0
      ? 'No results'
      : `Showing ${from}–${to} of ${total}`;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 border-t border-border text-sm text-muted-foreground',
        className
      )}
    >
      <p>{summary}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 text-foreground font-medium">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
