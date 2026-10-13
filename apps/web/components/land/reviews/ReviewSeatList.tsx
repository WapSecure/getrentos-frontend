'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge, EmptyState, PageErrorState, Pagination } from '@getrentos/ui';
import { CalendarClock, ChevronRight, ClipboardCheck, MapPin } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { landReviewKeys } from '@/lib/landSalesQueryKeys';
import { landReviewerService } from '@/services/landReviewerService';
import { LAND_TITLE_TYPE_LABELS } from '@/types/land';
import { LAND_REVIEWER_ROLE_LABELS } from '@/types/landReviewer';
import { pendingChecks } from './reviewRules';

const PAGE_SIZE = 20;

/** The professional's active land review seats. */
export const ReviewSeatList = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: landReviewKeys.list(page),
    queryFn: () => unwrap(landReviewerService.listMine(page, PAGE_SIZE)),
  });
  const seats = data?.items ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <PageErrorState
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }
  if (seats.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No reviews assigned to you"
        description="When GetRentos engages you as a surveyor, lawyer, valuer or inspector on a land case, it appears here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {seats.map((seat) => {
          const pending = pendingChecks(seat.checks).length;
          return (
            <li key={seat.seatId}>
              <Link
                href={LAND_BUYER_ROUTES.review(seat.seatId)}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{seat.propertyTitle}</span>
                    <Badge variant="info">{LAND_REVIEWER_ROLE_LABELS[seat.role]}</Badge>
                    {seat.overdue && <Badge variant="danger">Overdue</Badge>}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {seat.city}, {seat.state}
                    </span>
                    {seat.titleType && <span>{LAND_TITLE_TYPE_LABELS[seat.titleType]}</span>}
                    <span>Engaged {formatDate(seat.invitedAt)}</span>
                    {seat.dueAt && (
                      <span
                        className={`inline-flex items-center gap-1 ${seat.overdue ? 'text-destructive' : ''}`}
                      >
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                        Due {formatDate(seat.dueAt)}
                      </span>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {pending === 0
                      ? 'All checks decided: ready for your report.'
                      : `${pending} of ${seat.checks.length} checks to decide`}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
      {total > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}
    </div>
  );
};
