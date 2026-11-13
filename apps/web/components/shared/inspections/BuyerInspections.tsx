'use client';

import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardTitle,
  DescriptionList,
  EmptyState,
  Field,
  ListSkeleton,
  PageErrorState,
  Textarea,
  Toast,
  type BadgeVariant,
} from '@sureground/ui';
import { CalendarClock, LocateFixed, MapPin, ScanSearch, UserRound } from '@sureground/icons';
import {
  boundaryTone,
  INSPECTION_ON_SITE_TOLERANCE_M,
  LAND_BOUNDARY_LABELS,
  LAND_INSPECTION_STATUS_LABELS,
  photoLocationSummary,
  type LandInspectionStatus,
  formatLocation,
} from '@sureground/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import {
  prePurchaseInspectionKeys,
  prePurchaseInspectionService,
} from '@/services/prePurchaseInspectionService';
import type { PrePurchaseInspection } from '@/types/prePurchaseInspection';
import type { TourScope } from '@/types/siteTour';
import { InspectionReportCard } from '@/components/land/watch/InspectionReportCard';
import { PropertyThumb } from '@/components/shared/property/PropertyThumb';

type Notify = (message: string, variant?: 'success' | 'error') => void;

const STATUS_TONE: Record<LandInspectionStatus, BadgeVariant> = {
  REQUESTED: 'neutral',
  ASSIGNED: 'info',
  SUBMITTED: 'info',
  ESCALATED: 'info',
  QUERIED: 'warning',
  ACCEPTED: 'success',
  CANCELLED: 'neutral',
};

const nextStep = (i: PrePurchaseInspection): string => {
  switch (i.status) {
    case 'REQUESTED':
      return 'Sureground is finding an accredited inspector near the property.';
    case 'ASSIGNED':
      return i.dueBy
        ? `An inspector is booked to visit by ${formatDate(i.dueBy)}.`
        : 'An inspector is booked to visit.';
    case 'SUBMITTED':
    case 'ESCALATED':
      return 'The inspector has reported. Sureground is checking it before you see it.';
    case 'QUERIED':
      return 'Sureground has asked the inspector about the report and is waiting for answers.';
    case 'ACCEPTED':
      return 'Report ready. Ask about anything in it, or request a reinspection.';
    case 'CANCELLED':
      return 'Cancelled.';
  }
};

const Meta = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <li className="inline-flex min-w-0 items-center gap-1.5">
    <span aria-hidden="true" className="shrink-0 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
      {icon}
    </span>
    <span className="min-w-0">{children}</span>
  </li>
);

const InspectionRow = ({
  inspection,
  scope,
  notify,
}: {
  inspection: PrePurchaseInspection;
  scope: TourScope;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'none' | 'ask' | 'reinspect'>('none');
  const [text, setText] = useState('');
  const done = (message: string) => (updated: PrePurchaseInspection) => {
    queryClient.setQueryData<PrePurchaseInspection[]>(
      prePurchaseInspectionKeys.mine(scope),
      (list) =>
        list?.some((x) => x.id === updated.id)
          ? list.map((x) => (x.id === updated.id ? updated : x))
          : [updated, ...(list ?? [])]
    );
    void queryClient.invalidateQueries({ queryKey: prePurchaseInspectionKeys.mine(scope) });
    setMode('none');
    setText('');
    notify(message);
  };
  const fail = (reason: Error) => notify(reason.message, 'error');
  const ask = useMutation({
    mutationFn: () => unwrap(prePurchaseInspectionService.ask(scope, inspection.id, text)),
    onSuccess: done('Question sent. Sureground will answer here.'),
    onError: fail,
  });
  const reinspect = useMutation({
    mutationFn: () => unwrap(prePurchaseInspectionService.reinspect(scope, inspection.id, text)),
    onSuccess: done('Reinspection requested.'),
    onError: fail,
  });
  const accepted = inspection.status === 'ACCEPTED';
  const report = inspection.report;
  const photos = report ? photoLocationSummary(report.evidence) : null;
  const fieldId = `inspection-${inspection.id}-${mode}`;
  const place = inspection.place === 'property' || inspection.propertyId ? 'home' : 'land';

  return (
    <li>
      <Card>
        <div className="flex gap-4 p-4 sm:p-5">
          <PropertyThumb src={inspection.coverImageUrl} alt="" place={place} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
              <div className="min-w-0">
                <CardTitle as="h3" className="break-words">
                  {inspection.land}
                </CardTitle>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {formatLocation(inspection.city, inspection.state)}
                  {inspection.reinspectionOfId ? ' · reinspection' : ''}
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-xs">{inspection.reference}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {report?.boundaryCondition && (
                  <Badge variant={boundaryTone(report.boundaryCondition)}>
                    {LAND_BOUNDARY_LABELS[report.boundaryCondition]}
                  </Badge>
                )}
                <Badge dot variant={STATUS_TONE[inspection.status]}>
                  {LAND_INSPECTION_STATUS_LABELS[inspection.status]}
                </Badge>
              </div>
            </div>
            <p className="text-sm font-medium text-foreground">{nextStep(inspection)}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <Meta icon={<UserRound />}>
                {inspection.inspector
                  ? `Inspector: ${inspection.inspector.name}`
                  : 'Inspector not yet assigned'}
              </Meta>
              <Meta icon={<CalendarClock />}>
                {report?.submittedAt
                  ? `Visited ${formatDate(report.submittedAt)}`
                  : `Requested ${formatDate(inspection.createdAt)}`}
              </Meta>
              {photos && photos.level !== 'empty' && (
                <Meta icon={<LocateFixed />}>
                  <span
                    className={
                      photos.tone === 'success'
                        ? 'text-success'
                        : photos.tone === 'warning'
                          ? 'text-warning'
                          : undefined
                    }
                  >
                    {photos.label}
                  </span>{' '}
                  (within {INSPECTION_ON_SITE_TOLERANCE_M} m)
                </Meta>
              )}
            </ul>
          </div>
        </div>
        <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
          {report && <InspectionReportCard inspection={inspection} embedded />}
          {inspection.questions.length > 0 && (
            <DescriptionList
              columns={1}
              items={inspection.questions.map((q) => ({
                label: `You asked, ${formatDate(q.askedAt)}`,
                value: q.question,
                hint: q.answer
                  ? `Sureground${q.answeredAt ? ` (${formatDate(q.answeredAt)})` : ''}: ${q.answer}`
                  : 'Waiting for an answer.',
              }))}
            />
          )}
          {mode !== 'none' && (
            <Field
              label={mode === 'ask' ? 'Your question' : 'What should the inspector look at again?'}
              htmlFor={fieldId}
            >
              <Textarea
                id={fieldId}
                rows={2}
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
          )}
          <p className="text-xs leading-5 text-muted-foreground">{inspection.disclaimer}</p>
        </div>
        {accepted && (
          <CardFooter>
            {mode === 'none' ? (
              <>
                <Button variant="ghost" onClick={() => setMode('reinspect')}>
                  Ask for a reinspection
                </Button>
                <Button variant="outline" onClick={() => setMode('ask')}>
                  Ask about the report
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMode('none');
                    setText('');
                  }}
                >
                  Back
                </Button>
                <Button
                  disabled={text.trim().length < 10 || ask.isPending || reinspect.isPending}
                  isLoading={ask.isPending || reinspect.isPending}
                  onClick={() => (mode === 'ask' ? ask.mutate() : reinspect.mutate())}
                >
                  {mode === 'ask' ? 'Send question' : 'Request reinspection'}
                </Button>
              </>
            )}
          </CardFooter>
        )}
      </Card>
    </li>
  );
};

/** `land`: land inspections only (land routes). `all`: every inspection, homes and land. */
export const BuyerInspections = ({ scope }: { scope: TourScope }) => {
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const list = useQuery({
    queryKey: prePurchaseInspectionKeys.mine(scope),
    queryFn: () => unwrap(prePurchaseInspectionService.mine(scope)),
  });
  const notify: Notify = (message, variant = 'success') => setToast({ message, variant });

  if (list.isLoading) {
    return <ListSkeleton rows={3} variant="cards" label="Loading inspections" />;
  }
  if (list.isError) {
    return (
      <PageErrorState
        description={list.error instanceof Error ? list.error.message : undefined}
        onRetry={() => list.refetch()}
        isRetrying={list.isRefetching}
      />
    );
  }
  const items = list.data ?? [];
  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          icon={ScanSearch}
          title="No inspections yet"
          description="Commission one from any listing. Reports arrive here once Sureground has checked them."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((inspection) => (
            <InspectionRow
              key={inspection.id}
              inspection={inspection}
              scope={scope}
              notify={notify}
            />
          ))}
        </ul>
      )}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
};
