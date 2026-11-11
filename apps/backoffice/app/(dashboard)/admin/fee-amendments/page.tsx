'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Percent } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  ListSkeleton,
  NumberInput,
  PageErrorState,
  PageHeader,
  SegmentedControl,
  Select,
  Textarea,
  useToast,
  type BadgeVariant,
} from '@sureground/ui';
import { unwrap } from '@sureground/shared';

import {
  adminFeeAmendmentService,
  adminManagedService,
  type FeeAmendment,
  type FeeAmendmentStatus,
  type ManagementFeeType,
} from '@/services/adminManagedService';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '../layout';

/**
 * BD-2: every fee change across management agreements, and the only place a Sureground Managed fee
 * is proposed. The owner (and every co-owner) must accept before it applies.
 */

const REASON_MIN = 10;
const MONTHS_AHEAD = 12;

type View = 'PENDING' | 'ALL' | 'ACCEPTED' | 'CLOSED';

const VIEWS: { value: View; label: string }[] = [
  { value: 'PENDING', label: 'Waiting' },
  { value: 'ACCEPTED', label: 'Agreed' },
  { value: 'CLOSED', label: 'Declined or lapsed' },
  { value: 'ALL', label: 'All' },
];

const STATUS_META: Record<FeeAmendmentStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Waiting for an answer', variant: 'warning' },
  ACCEPTED: { label: 'Agreed', variant: 'success' },
  DECLINED: { label: 'Declined', variant: 'danger' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'neutral' },
  EXPIRED: { label: 'Lapsed', variant: 'neutral' },
};

const SIDE_LABEL = { OWNER: 'Owner', MANAGER: 'Manager', SUREGROUND: 'Sureground' } as const;

const FEE_TYPES = [
  { value: 'PERCENTAGE' as const, label: 'Percentage of rent' },
  { value: 'FLAT' as const, label: 'Flat amount' },
];

function lagosDay(value: string | null | undefined): string {
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

function monthStarts(earliest: string): { value: string; label: string }[] {
  const [year, month] = earliest.split('-').map(Number);
  return Array.from({ length: MONTHS_AHEAD }, (_, i) => {
    const y = year + Math.floor((month - 1 + i) / 12);
    const m = ((month - 1 + i) % 12) + 1;
    const value = `${y}-${String(m).padStart(2, '0')}-01`;
    return { value, label: lagosDay(value) };
  });
}

export default function AdminFeeAmendmentsPage() {
  const user = useAdminUser();
  const canOperate = hasAdminPermission(user?.roles, 'managed.operate');
  const [view, setView] = useState<View>('PENDING');

  const list = useQuery({
    queryKey: ['admin', 'fee-amendments'],
    queryFn: () => unwrap(adminFeeAmendmentService.list()),
  });

  const rows = useMemo(() => {
    const all = list.data ?? [];
    if (view === 'ALL') return all;
    if (view === 'CLOSED')
      return all.filter((a) => ['DECLINED', 'WITHDRAWN', 'EXPIRED'].includes(a.status));
    return all.filter((a) => a.status === view);
  }, [list.data, view]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee changes"
        description="Changes to the fee in a signed management agreement. Nothing changes until the other side accepts, every co-owner included, and a new fee never applies to a past statement."
      />

      {canOperate && <ProposeManagedFee />}

      <SegmentedControl
        aria-label="Which fee changes"
        value={view}
        onValueChange={setView}
        segments={VIEWS}
        size="sm"
      />

      {list.isLoading ? (
        <ListSkeleton variant="cards" rows={3} />
      ) : list.error ? (
        <PageErrorState description={(list.error as Error).message} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="No fee changes here"
          description="Proposals from owners, managers and Sureground show up here."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((amendment) => (
            <AmendmentCard key={amendment.id} amendment={amendment} />
          ))}
        </div>
      )}
    </div>
  );
}

function AmendmentCard({ amendment }: { amendment: FeeAmendment }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const withdraw = useMutation({
    mutationFn: () => unwrap(adminFeeAmendmentService.withdraw(amendment.id)),
    onSuccess: () => {
      toast.success('Proposal withdrawn.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'fee-amendments'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const meta = STATUS_META[amendment.status];

  return (
    <Card static className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{amendment.propertyTitle ?? 'Property'}</p>
          <p className="text-sm text-muted-foreground">
            {amendment.ownerName ?? 'Owner'} with {amendment.managerName ?? 'the manager'}
          </p>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>
      <p className="mt-2 text-sm text-foreground">
        {amendment.from.label} to {amendment.to.label} from {lagosDay(amendment.effectiveFrom)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">&ldquo;{amendment.reason}&rdquo;</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Proposed by {amendment.proposedByName ?? SIDE_LABEL[amendment.proposerSide]} (
        {SIDE_LABEL[amendment.proposerSide].toLowerCase()} side) on {lagosDay(amendment.createdAt)}.
        {amendment.status === 'PENDING'
          ? ` Lapses on ${lagosDay(amendment.expiresAt)}. ${amendment.quorum.ownersAccepted} of ${amendment.quorum.ownersRequired} owners accepted${amendment.quorum.managerAccepted ? '' : ', manager not yet'}.`
          : ` Closed ${lagosDay(amendment.decidedAt)}${amendment.decidedByName ? ` by ${amendment.decidedByName}` : ''}.${amendment.decisionNote ? ` ${amendment.decisionNote}` : ''}`}
      </p>
      {amendment.permissions.canWithdraw && (
        <Button
          className="mt-3"
          variant="ghost"
          size="sm"
          isLoading={withdraw.isPending}
          onClick={() => withdraw.mutate()}
        >
          Withdraw proposal
        </Button>
      )}
    </Card>
  );
}

function ProposeManagedFee() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [mandateId, setMandateId] = useState('');
  const [type, setType] = useState<ManagementFeeType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [reason, setReason] = useState('');

  const active = useQuery({
    queryKey: ['admin', 'managed-active'],
    queryFn: () => unwrap(adminManagedService.listActive()),
  });
  const overview = useQuery({
    queryKey: ['admin', 'fee-amendments', mandateId],
    queryFn: () => unwrap(adminFeeAmendmentService.overview(mandateId)),
    enabled: Boolean(mandateId),
  });

  const engagementOptions = useMemo(
    () =>
      (active.data ?? [])
        .filter((m) => m.status === 'ACTIVE' || m.status === 'SUSPENDED')
        .map((m) => ({
          value: m.id,
          label: `${m.propertyTitle ?? 'Property'} · ${m.ownerName ?? 'Owner'}`,
        })),
    [active.data]
  );

  const data = overview.data;
  const numeric = Number(value);
  const valueError =
    value === ''
      ? null
      : !Number.isFinite(numeric) || numeric < 0
        ? 'Enter a fee of zero or more.'
        : type === 'PERCENTAGE' && numeric > (data?.maxPercentage ?? 100)
          ? 'A percentage fee cannot be more than 100%.'
          : null;
  const start = effectiveFrom || data?.earliestEffectiveFrom || '';
  const ready =
    Boolean(data?.canPropose) &&
    value !== '' &&
    !valueError &&
    reason.trim().length >= REASON_MIN &&
    Boolean(start);

  const propose = useMutation({
    mutationFn: () =>
      unwrap(
        adminFeeAmendmentService.propose(mandateId, {
          type,
          value: numeric,
          reason: reason.trim(),
          effectiveFrom: start,
        })
      ),
    onSuccess: () => {
      toast.success('Proposal sent. The owner has 14 days to answer.');
      setValue('');
      setReason('');
      setEffectiveFrom('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'fee-amendments'] });
    },
  });

  return (
    <Card static className="space-y-3 p-4">
      <div>
        <h2 className="text-sm font-semibold">Propose a Sureground Managed fee change</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Only Sureground staff propose a Managed fee. The owner, and every co-owner, must accept
          it. You will be asked to confirm it is you.
        </p>
      </div>
      <Field label="Engagement">
        <Select
          value={mandateId}
          onValueChange={(next) => {
            setMandateId(next);
            setEffectiveFrom('');
          }}
          options={engagementOptions}
          placeholder={active.isLoading ? 'Loading engagements' : 'Choose a live engagement'}
        />
      </Field>

      {mandateId && overview.isLoading && <ListSkeleton rows={1} />}
      {data && !data.canPropose && data.proposeBlockedReason && (
        <Alert variant="neutral">{data.proposeBlockedReason}</Alert>
      )}
      {data?.canPropose && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (ready) propose.mutate();
          }}
        >
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
            hint={data.currentFee ? `Agreed now: ${data.currentFee.label}` : undefined}
            error={valueError}
            required
          >
            <NumberInput value={value} onValueChange={setValue} integer={type === 'FLAT'} />
          </Field>
          <Field
            label="Starts on"
            hint="The first day of a rent period, from next month on."
            required
          >
            <Select
              value={start}
              onValueChange={setEffectiveFrom}
              options={monthStarts(data.earliestEffectiveFrom)}
              searchable={false}
            />
          </Field>
          <Field
            label="Reason"
            hint={`At least ${REASON_MIN} characters. The owner reads it before deciding.`}
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
          <Button type="submit" size="sm" disabled={!ready} isLoading={propose.isPending}>
            Send proposal to the owner
          </Button>
        </form>
      )}
    </Card>
  );
}
