'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, ConfirmDialog, PageErrorState, Textarea, Toast } from '@getrentos/ui';
import { ArrowLeft, CalendarClock, MapPin } from 'lucide-react';
import { boundaryCorners } from '@getrentos/shared';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { landReviewKeys } from '@/lib/landSalesQueryKeys';
import { landReviewerService } from '@/services/landReviewerService';
import { ParcelBoundaryMap } from '@/components/maps/ParcelBoundaryMap';
import {
  LAND_AREA_UNIT_LABELS,
  LAND_TITLE_TYPE_LABELS,
  type LandAreaUnit,
  type LandDiligenceCheckStatus,
} from '@/types/land';
import {
  LAND_REVIEWER_ROLE_LABELS,
  LAND_REVIEW_REPORT_MAX,
  LAND_REVIEW_REPORT_MIN,
  type LandReviewCase,
} from '@/types/landReviewer';
import { ReviewCheckRow } from './ReviewCheckRow';
import { ReviewDocuments } from './ReviewDocuments';
import { pendingChecks } from './reviewRules';

const Fact = ({ label, value }: { label: string; value?: string | number | null }) =>
  value === null || value === undefined || value === '' ? null : (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );

/** The case as the reviewer's seat sees it: their checks, the parcel and its documents. */
export const ReviewSeatDetail = ({ seatId }: { seatId: string }) => {
  const queryClient = useQueryClient();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [report, setReport] = useState('');
  const [confirmReport, setConfirmReport] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: landReviewKeys.seat(seatId),
    queryFn: () => unwrap(landReviewerService.getSeat(seatId)),
  });

  const store = (next: LandReviewCase) => {
    queryClient.setQueryData(landReviewKeys.seat(seatId), next);
    queryClient.invalidateQueries({ queryKey: landReviewKeys.all, refetchType: 'none' });
  };

  const decide = useMutation({
    mutationFn: (v: { key: string; status: LandDiligenceCheckStatus; note: string }) =>
      unwrap(
        landReviewerService.decideCheck(seatId, v.key, {
          status: v.status,
          note: v.note,
          expectedVersion: data?.caseVersion,
        })
      ),
    onMutate: (v) => setSavingKey(v.key),
    onSuccess: (next) => {
      store(next);
      setToast({ message: 'Decision saved.', variant: 'success' });
    },
    onError: (reason: Error) => {
      setToast({ message: reason.message, variant: 'error' });
      // Someone else changed the case: load the current version to decide against.
      if (reason instanceof ApiError && reason.status === 409) refetch();
    },
    onSettled: () => setSavingKey(null),
  });

  const submit = useMutation({
    mutationFn: () => unwrap(landReviewerService.submitReport(seatId, report)),
    onSuccess: (next) => {
      store(next);
      setReport('');
      setToast({ message: 'Report filed. Thank you.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }
  if (isError || !data) {
    return (
      <PageErrorState
        title="This review is not available"
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  const active = data.seatStatus === 'ACTIVE';
  const pending = pendingChecks(data.checks);
  const corners = boundaryCorners(data.parcel.boundaryGeometry);
  const reportLength = report.trim().length;
  const p = data.parcel;

  return (
    <div className="space-y-8">
      <Link
        href={LAND_BUYER_ROUTES.REVIEWS}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> My reviews
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{LAND_REVIEWER_ROLE_LABELS[data.role]}</Badge>
          <Badge
            variant={
              active
                ? data.overdue
                  ? 'danger'
                  : 'warning'
                : data.seatStatus === 'COMPLETED'
                  ? 'success'
                  : 'neutral'
            }
          >
            {active
              ? data.overdue
                ? 'Overdue'
                : 'In progress'
              : data.seatStatus === 'COMPLETED'
                ? 'Report filed'
                : 'Withdrawn'}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{data.propertyTitle}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden /> {p.address}, {p.city}, {p.state}
          </span>
          {data.dueAt && (
            <span
              className={`inline-flex items-center gap-1 ${data.overdue ? 'font-medium text-destructive' : ''}`}
            >
              <CalendarClock className="h-4 w-4" aria-hidden /> Report due {formatDate(data.dueAt)}
            </span>
          )}
        </p>
        {data.seatStatus === 'REVOKED' && (
          <p className="rounded-xl bg-secondary p-3 text-sm text-foreground">
            GetRentos has withdrawn this engagement. The case is shown for your records only.
          </p>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="checks-heading" className="space-y-3">
            <div>
              <h2 id="checks-heading" className="text-lg font-semibold text-foreground">
                Your checks
              </h2>
              <p className="text-sm text-muted-foreground">
                {active
                  ? `${data.checks.length - pending.length} of ${data.checks.length} decided. Your notes are visible to GetRentos reviewers, not to the owner or buyers.`
                  : 'Decisions are closed on this seat.'}
              </p>
            </div>
            <ul className="space-y-3">
              {data.checks.map((check) => (
                <ReviewCheckRow
                  key={`${check.key}-${check.status}-${check.decidedAt ?? ''}`}
                  check={check}
                  documents={data.documents}
                  editable={active}
                  isSaving={savingKey === check.key}
                  onDecide={(status, note) => decide.mutate({ key: check.key, status, note })}
                />
              ))}
            </ul>
          </section>

          <section aria-labelledby="docs-heading" className="space-y-3">
            <h2 id="docs-heading" className="text-lg font-semibold text-foreground">
              Documents
            </h2>
            <ReviewDocuments documents={data.documents} checks={data.checks} />
          </section>

          <section aria-labelledby="report-heading" className="space-y-3">
            <h2 id="report-heading" className="text-lg font-semibold text-foreground">
              Final report
            </h2>
            {active ? (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setConfirmReport(true);
                }}
              >
                <label htmlFor="review-report" className="sr-only">
                  Report
                </label>
                <Textarea
                  id="review-report"
                  rows={8}
                  maxLength={LAND_REVIEW_REPORT_MAX}
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Your findings, the sources you relied on, and any reservations."
                />
                <p className="text-xs text-muted-foreground">
                  {reportLength < LAND_REVIEW_REPORT_MIN
                    ? `At least ${LAND_REVIEW_REPORT_MIN} characters.`
                    : `${reportLength.toLocaleString()} characters.`}
                  {pending.length > 0 &&
                    ` Decide every check first (${pending.length} still pending).`}
                </p>
                <Button
                  type="submit"
                  disabled={
                    reportLength < LAND_REVIEW_REPORT_MIN || pending.length > 0 || submit.isPending
                  }
                  isLoading={submit.isPending}
                >
                  File report
                </Button>
              </form>
            ) : data.report ? (
              <p className="whitespace-pre-line rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
                {data.report}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No report was filed.</p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section
            aria-labelledby="parcel-heading"
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 id="parcel-heading" className="font-semibold text-foreground">
              Parcel
            </h2>
            <dl className="mt-2 divide-y divide-border/60">
              <Fact label="Estate" value={p.estateName} />
              <Fact
                label="Plot"
                value={
                  [p.block && `Block ${p.block}`, p.plotNumber].filter(Boolean).join(', ') || null
                }
              />
              <Fact
                label="Area"
                value={`${p.areaValue.toLocaleString('en-NG')} ${LAND_AREA_UNIT_LABELS[p.areaUnit as LandAreaUnit] ?? p.areaUnit}${p.areaSqm ? ` (${Math.round(p.areaSqm).toLocaleString('en-NG')} m²)` : ''}`}
              />
              <Fact
                label="Title"
                value={p.titleType ? LAND_TITLE_TYPE_LABELS[p.titleType] : null}
              />
              <Fact label="Title number" value={p.titleNumber} />
              <Fact label="Survey number" value={p.surveyNumber} />
              <Fact label="Registry" value={p.registryAuthority} />
              <Fact label="Tenure" value={p.tenure} />
              <Fact label="Zoning" value={p.zoning} />
              <Fact label="Permitted use" value={p.permittedUse} />
              <Fact label="Registered owner" value={data.ownerLegalName} />
              <Fact
                label="Coordinates"
                value={
                  p.latitude !== null && p.longitude !== null
                    ? `${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}`
                    : null
                }
              />
            </dl>
            {p.boundaryNotes && (
              <p className="mt-3 text-sm text-muted-foreground">{p.boundaryNotes}</p>
            )}
          </section>
          {corners && (
            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Outline as drawn by the owner
              </p>
              <ParcelBoundaryMap corners={corners} height={260} />
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmReport}
        onOpenChange={setConfirmReport}
        title="File your report?"
        description="Filing completes your engagement on this case. You will not be able to change your decisions or the report afterwards."
        confirmLabel="File report"
        isLoading={submit.isPending}
        onConfirm={() => submit.mutateAsync().catch(() => undefined)}
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
