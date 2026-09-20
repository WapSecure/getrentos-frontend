'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Loader2, Phone, X } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { StarRating } from '@/components/landlord/vendors/StarRating';
import { formatVisit } from '@/components/landlord/vendors/VendorCard';
import type { Vendor, VendorJob } from '@/types/landlord';

interface VendorDetailModalProps {
  vendor: Vendor | null;
  onClose: () => void;
}

const statusLabel: Record<string, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

const JobRow = ({ job }: { job: VendorJob }) => (
  <li className="flex items-start justify-between gap-3 py-2.5 border-b border-border last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{job.issueTitle}</p>
      <p className="text-xs text-muted-foreground truncate">
        {job.propertyName}, {job.unitName} · {statusLabel[job.status] ?? job.status}
        {job.resolvedAt ? ` ${formatDate(job.resolvedAt)}` : ''}
      </p>
    </div>
    <div className="shrink-0 text-right tabular-nums">
      <p className="text-sm text-foreground">
        {job.approvedCost === null ? '—' : formatCurrency(job.approvedCost)}
      </p>
      {job.rating !== null && <StarRating value={job.rating} label="Job rating" />}
    </div>
  </li>
);

/** A vendor's whole record: how they rate, what they cost, how fast, and every job. */
export const VendorDetailModal = ({ vendor, onClose }: VendorDetailModalProps) => {
  const { data, isPending, isError } = useQuery({
    queryKey: landlordKeys.vendorDetail(vendor?.id ?? ''),
    queryFn: () => unwrap(landlordService.getVendorDetail(vendor?.id ?? '')),
    enabled: !!vendor,
  });

  if (!vendor) return null;
  const current = data?.vendor ?? vendor;

  const stats = [
    { label: 'Jobs completed', value: String(current.jobsCompleted) },
    { label: 'Open jobs', value: String(current.openJobs) },
    { label: 'Total spend', value: formatCurrency(current.totalSpend) },
    {
      label: 'Average per job',
      value: current.averageCost === null ? '—' : formatCurrency(current.averageCost),
    },
    {
      label: 'Average time to finish',
      value:
        current.averageResolutionDays === null
          ? '—'
          : `${current.averageResolutionDays} day${current.averageResolutionDays === 1 ? '' : 's'}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-label={`${current.name} details`}
        className="bg-card rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-border flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{current.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {current.serviceType}
              {!current.isActive && ' · Inactive'}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              {current.phone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-5">
          <div className="flex items-center gap-2">
            {current.ratingCount > 0 ? (
              <>
                <StarRating value={current.rating} size="md" label={`${current.name} rating`} />
                <span className="text-lg font-semibold text-foreground">
                  {current.rating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  from {current.ratingCount} rated job{current.ratingCount === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No ratings yet</span>
            )}
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 tabular-nums">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="text-base font-semibold text-foreground">{stat.value}</dd>
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>

          {isPending && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {isError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              We could not load this vendor&apos;s job history. Please close this and try again.
            </p>
          )}

          {data && (
            <>
              <section>
                <h4 className="text-sm font-semibold text-foreground mb-1">Upcoming visits</h4>
                {data.upcomingVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No visits booked.</p>
                ) : (
                  <ul>
                    {data.upcomingVisits.map((job) => (
                      <li
                        key={job.id}
                        className="flex items-center gap-2 py-2 border-b border-border last:border-0 text-sm"
                      >
                        <CalendarClock className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground">
                          {job.scheduledFor ? formatVisit(job.scheduledFor) : ''}
                        </span>
                        <span className="text-muted-foreground truncate">
                          {job.issueTitle} · {job.propertyName}, {job.unitName}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h4 className="text-sm font-semibold text-foreground mb-1">Job history</h4>
                {data.recentJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No jobs yet. Assign this vendor to a maintenance request to start their record.
                  </p>
                ) : (
                  <ul>
                    {data.recentJobs.map((job) => (
                      <JobRow key={job.id} job={job} />
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
