'use client';

import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FileText, Lock, ShieldCheck, UserRound } from '@sureground/icons';
import {
  Alert,
  Badge,
  Breadcrumbs,
  Card,
  CardSkeleton,
  PageErrorState,
  PageHeader,
  Skeleton,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { mandateKeys } from '@/lib/queryKeys';
import * as mandateService from '@/services/mandateService';
import {
  MANDATE_SCOPE_CHIP,
  MANDATE_SCOPE_LABELS,
  formatDay,
  grantsNothing,
  isLive,
  noticeEndsAt,
  noticeSummary,
} from '@/services/mandateService';
import { MandateActionButtons } from './MandateActionButtons';
import { CapabilityChip, formatMoment, MandateStatusBadge } from './mandatePresentation';
import { useMandateActions } from './useMandateActions';
import { describeAgencyError } from './agencyAccess';
import { FeeAmendmentPanel } from '@/components/shared/fee-amendments/FeeAmendmentPanel';

export function MandateDetailView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { act, runSimple, askReason, dialog } = useMandateActions();

  const { data, isLoading, error } = useQuery({
    queryKey: mandateKeys.one(id),
    queryFn: () => unwrap(mandateService.get(id)),
    enabled: Boolean(id),
  });

  const requests = useQuery({
    queryKey: mandateKeys.terminationRequests(id),
    queryFn: () => unwrap(mandateService.pendingTerminationRequests(id)),
    enabled: Boolean(id),
  });

  if (error && !data) {
    return <PageErrorState description={describeAgencyError(error)} />;
  }

  if (isLoading || !data) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
        <Skeleton className="h-6 w-64" />
        <CardSkeleton lines={3} />
        <CardSkeleton lines={5} />
      </div>
    );
  }

  const mandate = data;
  const live = isLive(mandate);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      <Breadcrumbs
        className="mb-0"
        items={[
          { label: 'Client engagements', href: '/agency/mandates' },
          { label: mandate.propertyTitle ?? 'Property' },
        ]}
      />

      <PageHeader
        title={mandate.propertyTitle ?? 'Property'}
        description={
          <>
            {mandate.ownerName ?? 'the owner'}
            <span aria-hidden> · </span>
            {mandate.managerIsSureground
              ? 'Sureground is the manager'
              : (mandate.managerOrganizationName ?? mandate.managerName ?? 'the manager')}
            <span aria-hidden> · </span>
            {noticeSummary(mandate)}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <MandateStatusBadge status={mandate.status} />
            {live && <Badge variant="success">In force</Badge>}
          </div>
        }
      />

      {act.isError && <Alert variant="danger">{(act.error as Error).message}</Alert>}

      <Card static className="p-4">
        <h2 className="text-sm font-semibold">What was agreed</h2>

        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Fact label="Owns the property" value={mandate.ownerName ?? '—'} icon={<UserRound />} />
          <Fact
            label="Acts as manager"
            value={
              mandate.managerIsSureground
                ? 'Sureground'
                : (mandate.managerOrganizationName ?? mandate.managerName ?? '—')
            }
          />
          <Fact label="Notice period" value={`${mandate.noticePeriodDays} days`} />
          <Fact label="Term" value={termSummary(mandate.startAt, mandate.endAt)} />
        </dl>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Scope</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {mandate.scope.map((scope) => (
              <Badge key={scope} variant="primary" title={MANDATE_SCOPE_LABELS[scope]}>
                {MANDATE_SCOPE_CHIP[scope]}
              </Badge>
            ))}
            <span className="sr-only">Capabilities granted by this scope:</span>
            <CapabilityChip on={mandate.capabilities.canList} label="list" />
            <CapabilityChip on={mandate.capabilities.canManage} label="manage" />
            <CapabilityChip on={mandate.capabilities.canTransact} label="money" />
          </div>
        </div>

        {grantsNothing(mandate) && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            This scope grants no access yet, so the workspace will look empty. That is the scope,
            not missing data.
          </p>
        )}

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Documents
          </p>
          <div className="mt-1.5 space-y-1 text-sm">
            <DocumentLine label="Management agreement" documentId={mandate.agreementDocumentId} />
            <DocumentLine label="Power of attorney" documentId={mandate.poaDocumentId} />
          </div>
        </div>

        <MandateActionButtons
          mandate={mandate}
          busy={act.isPending}
          onSimple={runSimple}
          onReason={askReason}
        />
      </Card>

      <Card static className="p-4">
        <FeeAmendmentPanel mandateId={mandate.id} />
      </Card>

      <Card static className="p-4">
        <h2 className="text-sm font-semibold">How it got here</h2>
        <ol className="mt-3 space-y-3">
          <Moment label="Created" at={mandate.createdAt} />
          {/* No timestamp is kept for submission, so no date is shown. */}
          <li className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-medium">Sent to the owner</span>
            <span className="text-muted-foreground">
              {mandate.submittedById ? 'sent' : 'not yet sent'}
            </span>
          </li>
          <Moment
            label="Signed by the owner"
            at={mandate.signedByOwnerAt}
            missing="Not yet signed"
          />
          <Moment
            label="Signed by the manager"
            at={mandate.signedByManagerAt}
            missing="Not yet signed"
          />
          <Moment
            label="Verified by Sureground"
            at={mandate.decidedAt}
            note={mandate.decisionNote}
            missing={mandate.status === 'REJECTED' ? 'Refused' : 'Awaiting verification'}
          />
          <Moment label="Notice served" at={mandate.noticeServedAt} missing="No notice served" />
          <Moment
            label={mandate.terminatedAt ? 'Notice period ended' : 'Notice period ends'}
            at={noticeEndsAt(mandate)}
          />
          <Moment
            label="Ended"
            at={mandate.terminatedAt}
            note={mandate.terminationReason}
            missing="Still running"
          />
          <Moment
            label="Handover pack exchanged"
            at={mandate.handoverAt}
            missing={mandate.status === 'TERMINATED' ? 'Outstanding' : undefined}
          />
        </ol>

        {mandate.status === 'PENDING_OPS' && (
          <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Both sides have signed. A Sureground officer still has to verify it before anyone can
            act under it. Until then, it provides no access.
          </p>
        )}
      </Card>

      {requests.data && requests.data.length > 0 && (
        <Card static className="p-4">
          <h2 className="text-sm font-semibold">Requests to end this engagement</h2>
          <ul className="mt-3 space-y-3">
            {requests.data.map((request) => (
              <li key={request.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {request.requestedByName ?? 'A Sureground officer'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {REQUEST_STATUS_LABEL[request.status]} · {formatMoment(request.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{request.reason}</p>
                {request.status === 'PENDING' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Still open. The engagement keeps running and access is unchanged until a second
                    Sureground officer approves it.
                  </p>
                )}
                {request.decidedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Decided by {request.decidedByName ?? 'a Sureground officer'} on{' '}
                    {formatMoment(request.decidedAt)}
                    {request.decisionNote ? ` — ${request.decisionNote}` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {dialog}
    </div>
  );
}

const REQUEST_STATUS_LABEL = {
  PENDING: 'Awaiting a second approver',
  APPROVED: 'Approved',
  CANCELLED: 'Withdrawn',
} as const;

function Fact({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon ? <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span> : null}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function Moment({
  label,
  at,
  note,
  missing,
}: {
  label: string;
  at: string | null | undefined;
  note?: string | null;
  missing?: string;
}) {
  if (!at) {
    if (missing === undefined) return null;
    return (
      <li className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">— {missing}</span>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{formatMoment(at)}</span>
      {note ? <span className="basis-full text-xs text-muted-foreground">{note}</span> : null}
    </li>
  );
}

function DocumentLine({ label, documentId }: { label: string; documentId: string | null }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <span>{label}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {documentId ? `${documentId.slice(0, 8)}…` : 'not attached'}
      </span>
    </p>
  );
}

function termSummary(startAt: string | null, endAt: string | null): string {
  if (!startAt && !endAt) return 'No dates agreed';
  if (!endAt) return `From ${formatDay(startAt)} · rolling`;
  return `${formatDay(startAt)} to ${formatDay(endAt)}`;
}
