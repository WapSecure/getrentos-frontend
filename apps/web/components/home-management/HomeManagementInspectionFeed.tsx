'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ClipboardCheck, CircleAlert, FileSearch, MapPin, UserRound } from 'lucide-react';
import { Badge } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import { homeManagementService } from '@/services/homeManagementService';

const INSPECTION_PAGE_SIZE = 6;

export function HomeManagementInspectionFeed() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: [...homeManagementKeys.inspections, { page, pageSize: INSPECTION_PAGE_SIZE }],
    queryFn: () =>
      unwrap(homeManagementService.listInspections({ page, pageSize: INSPECTION_PAGE_SIZE })),
  });
  const inspections = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <section aria-labelledby="inspection-feed-heading" className="mt-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Field evidence</p>
          <h2
            id="inspection-feed-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Inspection reports from your properties.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review recent on-site findings, who completed them, and the operational task behind each
            report.
          </p>
        </div>
        {!isLoading && total > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((page - 1) * INSPECTION_PAGE_SIZE + 1, total)}–
            {Math.min(page * INSPECTION_PAGE_SIZE, total)} of {total} reports
          </p>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <InspectionLoadingState />
        ) : error ? (
          <EmptyState
            icon={CircleAlert}
            title="Inspection reports could not be loaded"
            description="Refresh the page to try again."
          />
        ) : inspections.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No field inspection reports yet"
            description="Submitted inspection reports from your assigned field Agents will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="divide-y divide-border">
              {inspections.map((inspection) => {
                const submittedAt = inspection.submittedAt ?? inspection.createdAt;
                const condition = inspection.overallCondition?.trim() || 'Condition not recorded';

                return (
                  <article
                    key={inspection.id}
                    className="grid gap-4 px-5 py-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground">
                          {inspection.task.title ?? 'Field inspection'}
                        </h3>
                        <Badge variant={inspection.status === 'SUBMITTED' ? 'success' : 'neutral'}>
                          {inspection.status === 'SUBMITTED' ? 'Submitted' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{condition}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {inspection.property.title ?? 'Property'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {inspection.agent.legalName ?? 'Assigned Agent'}
                        </span>
                      </div>
                    </div>
                    <div className="text-left md:min-w-32 md:text-right">
                      <p className="text-xs text-muted-foreground">
                        {inspection.submittedAt ? 'Submitted' : 'Recorded'}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDate(submittedAt)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
        {total > 0 && (
          <Pagination
            page={page}
            pageSize={INSPECTION_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            className="rounded-b-2xl border border-border bg-card"
          />
        )}
      </div>
    </section>
  );
}

function InspectionLoadingState() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse border-b border-border last:border-b-0" />
      ))}
    </div>
  );
}
