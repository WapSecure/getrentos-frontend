'use client';

import { useEffect, useState } from 'react';
import { DoorOpen, LogOut, SearchX } from '@sureground/icons';
import { Button, EmptyState, ListSkeleton, Pagination, SearchInput } from '@sureground/ui';
import { cn } from '@sureground/shared';
import type { VisitorPass } from '@/types/estate';
import { formatStay } from '@/lib/visitorStay';

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

/** Re-renders once a minute so the "inside for" durations stay current without a refetch. */
const useMinuteClock = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};

interface InsideNowPanelProps {
  visitors: VisitorPass[];
  total: number;
  /** Server total before optimistic check-outs, used for paging. */
  pagedTotal: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  search: string;
  query: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  checkingOutId?: string;
  isCheckingOut: boolean;
  onCheckOut: (pass: VisitorPass) => void;
}

export const InsideNowPanel = ({
  visitors,
  total,
  pagedTotal,
  page,
  pageSize,
  onPageChange,
  search,
  query,
  onSearchChange,
  isLoading,
  isFetching,
  checkingOutId,
  isCheckingOut,
  onCheckOut,
}: InsideNowPanelProps) => {
  const now = useMinuteClock();
  const showSearch = total > 0 || search.length > 0;

  return (
    <section
      aria-labelledby="inside-now-title"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 id="inside-now-title" className="text-base font-semibold text-foreground">
              Inside now
            </h2>
            {!isLoading && (
              <span
                className={cn(
                  'inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                  total > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                )}
                aria-label={query ? `${total} found` : `${total} inside`}
              >
                {total}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Visitors checked in at this estate who have not been checked out.
          </p>
        </div>
      </header>

      {showSearch && (
        <div className="border-b border-border px-5 py-3">
          <SearchInput
            value={search}
            onValueChange={onSearchChange}
            placeholder="Visitor, phone, unit or resident"
            label="Search visitors inside"
          />
        </div>
      )}

      {isLoading ? (
        <div className="p-5">
          <ListSkeleton rows={2} />
        </div>
      ) : visitors.length === 0 ? (
        query ? (
          <EmptyState
            bare
            size="compact"
            icon={SearchX}
            title={`No one inside matches "${query}"`}
            description="Check the spelling, or search by phone number, unit or the resident's name."
            action={
              <Button variant="outline" size="sm" onClick={() => onSearchChange('')}>
                Show everyone inside
              </Button>
            }
          />
        ) : (
          <EmptyState
            bare
            icon={DoorOpen}
            title="Nobody is checked in"
            description="When you check a visitor in, they appear here with the home they came to and the time they arrived. Check them out as they leave."
          />
        )
      ) : (
        <ul className="divide-y divide-border">
          {visitors.map((pass) => (
            <li
              key={pass.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground"
                >
                  {initials(pass.visitorName) || '?'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{pass.visitorName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {pass.unitLabel} · {pass.residentName}
                  </p>
                  {pass.checkedInAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Arrived {formatTime(pass.checkedInAt)} · inside for{' '}
                      <span className="text-foreground/80">
                        {formatStay(pass.checkedInAt, now)}
                      </span>
                      {pass.purpose ? ` · ${pass.purpose}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="shrink-0"
                icon={<LogOut className="h-3.5 w-3.5" />}
                disabled={isCheckingOut}
                isLoading={isCheckingOut && checkingOutId === pass.id}
                aria-label={`Check out ${pass.visitorName}`}
                onClick={() => onCheckOut(pass)}
              >
                Check out
              </Button>
            </li>
          ))}
        </ul>
      )}

      {pagedTotal > pageSize && (
        <div className="border-t border-border px-5 py-3">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={pagedTotal}
            onPageChange={onPageChange}
            isLoading={isFetching}
          />
        </div>
      )}
    </section>
  );
};
