'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Percent, Users } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Disclosure,
  Field,
  NumberInput,
  SegmentedControl,
  Select,
  Skeleton,
  Textarea,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { mandateKeys } from '@/lib/queryKeys';
import {
  FEE_AMENDMENT_STATUS_LABELS,
  acceptFeeAmendment,
  declineFeeAmendment,
  feeAmendments,
  proposeFeeAmendment,
  withdrawFeeAmendment,
  type FeeAmendment,
  type FeeAmendmentOverview,
  type ManagementFeeType,
} from '@/services/mandateService';

/**
 * BD-2: a fee in a signed agreement changes only by a proposal the other side accepts. Shown on the
 * agreement for the owner and for the manager; who may do what comes from the API.
 */

const REASON_MIN = 10;
const MONTHS_AHEAD = 12;

const FEE_TYPES = [
  { value: 'PERCENTAGE' as const, label: 'Percentage of rent' },
  { value: 'FLAT' as const, label: 'Flat amount' },
];

const STATUS_BADGE: Record<FeeAmendment['status'], 'warning' | 'success' | 'neutral' | 'danger'> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  DECLINED: 'danger',
  WITHDRAWN: 'neutral',
  EXPIRED: 'neutral',
};

/** A Lagos calendar day, "1 December 2026". */
export function formatLagosDay(value: string | null | undefined): string {
  if (!value) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00+01:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
}

/** The first day of each month from `earliest`, the only days a new fee may start on. */
function effectiveDateOptions(earliest: string): { value: string; label: string }[] {
  const [year, month] = earliest.split('-').map(Number);
  return Array.from({ length: MONTHS_AHEAD }, (_, i) => {
    const y = year + Math.floor((month - 1 + i) / 12);
    const m = ((month - 1 + i) % 12) + 1;
    const value = `${y}-${String(m).padStart(2, '0')}-01`;
    return { value, label: formatLagosDay(value) };
  });
}

function proposerLabel(amendment: FeeAmendment): string {
  if (amendment.proposerSide === 'SUREGROUND') return 'Sureground';
  if (amendment.proposerSide === 'MANAGER') {
    return amendment.managerName ?? amendment.proposedByName ?? 'The manager';
  }
  return amendment.proposedByName ?? 'The owner';
}

export function FeeAmendmentPanel({ mandateId }: { mandateId: string }) {
  const queryClient = useQueryClient();
  const [proposing, setProposing] = useState(false);

  const overview = useQuery({
    queryKey: mandateKeys.feeAmendments(mandateId),
    queryFn: () => unwrap(feeAmendments(mandateId)),
    enabled: Boolean(mandateId),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: mandateKeys.feeAmendments(mandateId) });

  if (overview.isLoading) return <Skeleton className="h-16 w-full" />;
  if (overview.error || !overview.data) {
    return (
      <Alert variant="neutral">
        {(overview.error as Error | null)?.message ??
          'We could not load the fee for this agreement.'}
      </Alert>
    );
  }

  const data = overview.data;

  return (
    <section aria-labelledby={`fee-${mandateId}`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id={`fee-${mandateId}`} className="flex items-center gap-1.5 text-sm font-semibold">
            <Percent className="h-4 w-4 text-muted-foreground" aria-hidden />
            Management fee
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {data.currentFee
              ? `Agreed fee: ${data.currentFee.label}`
              : 'No fee recorded on this agreement.'}
          </p>
        </div>
        {data.canPropose && !proposing && (
          <Button variant="outline" size="sm" onClick={() => setProposing(true)}>
            Propose a fee change
          </Button>
        )}
      </div>

      {proposing && (
        <ProposeForm
          mandateId={mandateId}
          overview={data}
          onDone={() => {
            setProposing(false);
            void refresh();
          }}
          onCancel={() => setProposing(false)}
        />
      )}

      {data.pending && <PendingProposal amendment={data.pending} onChanged={refresh} />}

      {!data.canPropose && !data.pending && data.proposeBlockedReason && (
        <p className="text-xs text-muted-foreground">{data.proposeBlockedReason}</p>
      )}

      {(data.history.length > 0 || data.versions.length > 0) && (
        <Disclosure summary="Fee history" className="rounded-xl border border-border">
          {data.versions.length > 0 && (
            <ol className="space-y-1">
              {data.versions.map((version) => (
                <li key={version.version} className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-foreground">Version {version.version}</span>
                  <span>
                    {version.fee?.label ?? 'No fee'} from {formatLagosDay(version.effectiveFrom)}
                    {version.version === 1 ? ' (as signed)' : ''}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {data.history.length > 0 && (
            <ul className="mt-3 space-y-2">
              {data.history.map((amendment) => (
                <li key={amendment.id} className="flex flex-wrap items-baseline gap-x-2">
                  <Badge variant={STATUS_BADGE[amendment.status]}>
                    {FEE_AMENDMENT_STATUS_LABELS[amendment.status]}
                  </Badge>
                  <span>
                    {amendment.from.label} to {amendment.to.label} from{' '}
                    {formatLagosDay(amendment.effectiveFrom)}, proposed by{' '}
                    {proposerLabel(amendment)} on {formatLagosDay(amendment.createdAt)}
                    {amendment.decidedAt ? `, closed ${formatLagosDay(amendment.decidedAt)}` : ''}
                    {amendment.decisionNote ? `. ${amendment.decisionNote}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Disclosure>
      )}
    </section>
  );
}

function PendingProposal({
  amendment,
  onChanged,
}: {
  amendment: FeeAmendment;
  onChanged: () => void;
}) {
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState('');

  const accept = useMutation({
    mutationFn: () => unwrap(acceptFeeAmendment(amendment.id)),
    onSuccess: onChanged,
  });
  const decline = useMutation({
    mutationFn: () => unwrap(declineFeeAmendment(amendment.id, note.trim())),
    onSuccess: () => {
      setDeclining(false);
      onChanged();
    },
  });
  const withdraw = useMutation({
    mutationFn: () => unwrap(withdrawFeeAmendment(amendment.id)),
    onSuccess: onChanged,
  });

  const busy = accept.isPending || decline.isPending || withdraw.isPending;
  const error = (accept.error ?? decline.error ?? withdraw.error) as Error | null;
  const { quorum, permissions } = amendment;
  const waitingOnOwners = quorum.ownersAccepted < quorum.ownersRequired;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {proposerLabel(amendment)} proposed {amendment.from.label} to {amendment.to.label}
        </p>
        <Badge variant="warning">{FEE_AMENDMENT_STATUS_LABELS.PENDING}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">&ldquo;{amendment.reason}&rdquo;</p>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Starts {formatLagosDay(amendment.effectiveFrom)}. Statements for earlier periods stay as
          they are.
        </li>
        <li>Lapses on {formatLagosDay(amendment.expiresAt)} if nobody answers.</li>
        {quorum.ownersRequired > 1 && (
          <li className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {quorum.ownersAccepted} of {quorum.ownersRequired} owners have accepted. Every owner
            must accept.
          </li>
        )}
        {!quorum.managerAccepted && <li>Waiting for the manager to answer.</li>}
        {quorum.managerAccepted && waitingOnOwners && !permissions.canAccept && (
          <li>Waiting for the owner side to answer.</li>
        )}
      </ul>

      {error && (
        <Alert variant="danger" className="mt-2">
          {error.message}
        </Alert>
      )}

      {declining ? (
        <div className="mt-3 space-y-2">
          <Field label="Note for the other side" optionalLabel="Optional">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Why you are declining"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              size="sm"
              isLoading={decline.isPending}
              disabled={busy}
              onClick={() => decline.mutate()}
            >
              Decline the change
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeclining(false)}>
              Keep it open
            </Button>
          </div>
        </div>
      ) : (
        (permissions.canAccept || permissions.canDecline || permissions.canWithdraw) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {permissions.canAccept && (
              <Button
                size="sm"
                isLoading={accept.isPending}
                disabled={busy}
                onClick={() => accept.mutate()}
              >
                Accept new fee
              </Button>
            )}
            {permissions.canDecline && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setDeclining(true)}
              >
                Decline
              </Button>
            )}
            {permissions.canWithdraw && (
              <Button
                variant="ghost"
                size="sm"
                isLoading={withdraw.isPending}
                disabled={busy}
                onClick={() => withdraw.mutate()}
              >
                Withdraw proposal
              </Button>
            )}
          </div>
        )
      )}
      {permissions.canAccept && (
        <p className="mt-2 text-xs text-muted-foreground">
          You will be asked to confirm it is you, because this changes future payments.
        </p>
      )}
    </div>
  );
}

function ProposeForm({
  mandateId,
  overview,
  onDone,
  onCancel,
}: {
  mandateId: string;
  overview: FeeAmendmentOverview;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<ManagementFeeType>(overview.currentFee?.type ?? 'PERCENTAGE');
  const [value, setValue] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(overview.earliestEffectiveFrom);
  const [reason, setReason] = useState('');

  const numeric = Number(value);
  const valueError =
    value === ''
      ? null
      : !Number.isFinite(numeric) || numeric < 0
        ? 'Enter a fee of zero or more.'
        : type === 'PERCENTAGE' && numeric > overview.maxPercentage
          ? `A percentage fee cannot be more than ${overview.maxPercentage}%.`
          : null;
  const reasonShort = reason.trim().length < REASON_MIN;
  const ready = value !== '' && !valueError && !reasonShort && Boolean(effectiveFrom);

  const propose = useMutation({
    mutationFn: () =>
      unwrap(
        proposeFeeAmendment(mandateId, {
          type,
          value: numeric,
          reason: reason.trim(),
          effectiveFrom,
        })
      ),
    onSuccess: onDone,
  });

  return (
    <form
      className="space-y-3 rounded-xl border border-border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) propose.mutate();
      }}
    >
      <p className="text-sm text-muted-foreground">
        The other side must accept before anything changes. The new fee applies from a rent period
        you choose, never to a past statement. If nobody answers in 14 days, the proposal lapses.
      </p>
      <SegmentedControl
        aria-label="Kind of fee"
        value={type}
        onValueChange={(next) => {
          setType(next);
          setValue('');
        }}
        segments={FEE_TYPES}
        size="sm"
      />
      <Field
        label={type === 'PERCENTAGE' ? 'New fee (% of rent)' : 'New fee (₦ per period)'}
        hint={overview.currentFee ? `Agreed now: ${overview.currentFee.label}` : undefined}
        error={valueError}
        required
      >
        <NumberInput
          value={value}
          onValueChange={setValue}
          integer={type === 'FLAT'}
          inputMode={type === 'FLAT' ? 'numeric' : 'decimal'}
        />
      </Field>
      <Field label="Starts on" hint="The first day of a rent period, from next month on." required>
        <Select
          value={effectiveFrom}
          onValueChange={setEffectiveFrom}
          options={effectiveDateOptions(overview.earliestEffectiveFrom)}
          searchable={false}
        />
      </Field>
      <Field
        label="Reason"
        hint={
          reasonShort
            ? `At least ${REASON_MIN} characters. The other side reads it before deciding.`
            : 'Kept on the record with the agreement.'
        }
        required
      >
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          maxLength={1000}
        />
      </Field>
      {propose.isError && <Alert variant="danger">{(propose.error as Error).message}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={!ready} isLoading={propose.isPending}>
          Send proposal
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
