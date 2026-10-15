'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  EmptyState,
  PageErrorState,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TimePicker,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';

import {
  adminManagedIntakeService,
  type IntakeStatus,
  type ManagedIntake,
  type ManagedServicingTier,
} from '@/services/adminManagedService';
import { adminService } from '@/services/adminService';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';

const TIER_OPTIONS: { value: ManagedServicingTier; label: string }[] = [
  { value: 'COLLECT_ONLY', label: 'Collect (5%)' },
  { value: 'COLLECT_MAINTAIN', label: 'Collect + Maintain (8%)' },
  { value: 'FULL_MANAGEMENT', label: 'Full management (10%)' },
];
const TIER_LABEL = Object.fromEntries(TIER_OPTIONS.map((o) => [o.value, o.label])) as Record<
  ManagedServicingTier,
  string
>;

const STAGE: Record<IntakeStatus, { label: string; variant: BadgeVariant }> = {
  SUBMITTED: { label: 'New request', variant: 'warning' },
  ASSESSMENT_SCHEDULED: { label: 'Visit booked', variant: 'info' },
  ASSESSED: { label: 'Assessed', variant: 'info' },
  PROPOSED: { label: 'Proposal sent', variant: 'info' },
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  DECLINED: { label: 'Declined', variant: 'danger' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'neutral' },
};

const CLASS_LABEL: Record<string, string> = {
  SINGLE_HOME: 'Single home',
  BLOCK_OF_FLATS: 'Block of flats',
  ESTATE_UNITS: 'Estate units',
  MIXED_USE: 'Mixed use',
  COMMERCIAL: 'Commercial',
};

type Filter = 'open' | IntakeStatus;

const textareaClass =
  'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

const lagosDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

/** One action form, with its own pending/error state. */
const useIntakeAction = <T,>(fn: (input: T) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: fn,
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-intakes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'managed-mandates'] });
    },
    onError: (err: Error) => setError(err.message || 'That did not go through.'),
  });
  return { mutation, error };
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-t border-border pt-4">
    <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
    {children}
  </div>
);

const IntakeCard = ({
  intake,
  canOperate,
  staffOptions,
}: {
  intake: ManagedIntake;
  canOperate: boolean;
  staffOptions: { value: string; label: string }[];
}) => {
  const [assessor, setAssessor] = useState(intake.assessorUserId ?? '');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');
  const [condition, setCondition] = useState<'GOOD' | 'FAIR' | 'POOR'>('GOOD');
  const [risk, setRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [findings, setFindings] = useState('');
  const [eligible, setEligible] = useState('yes');
  const [recommended, setRecommended] = useState<ManagedServicingTier>(intake.requestedTier);
  const [tier, setTier] = useState<ManagedServicingTier>(
    intake.recommendedTier ?? intake.requestedTier
  );
  const [exclusions, setExclusions] = useState('');
  const [note, setNote] = useState('');
  const [opening, setOpening] = useState(intake.openingPositionNote ?? '');
  const [declineReason, setDeclineReason] = useState('');

  const schedule = useIntakeAction(() =>
    unwrap(
      adminManagedIntakeService.scheduleAssessment(
        intake.id,
        assessor,
        `${visitDate}T${visitTime}:00+01:00`
      )
    )
  );
  const assess = useIntakeAction(() =>
    unwrap(
      adminManagedIntakeService.recordAssessment(intake.id, {
        condition,
        risk,
        findings: findings.trim(),
        eligible: eligible === 'yes',
        recommendedTier: recommended,
      })
    )
  );
  const propose = useIntakeAction(() =>
    unwrap(
      adminManagedIntakeService.propose(intake.id, {
        tier,
        ...(exclusions.trim() ? { exclusions: exclusions.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      })
    )
  );
  const confirmOpening = useIntakeAction(() =>
    unwrap(adminManagedIntakeService.confirmOpeningPosition(intake.id, opening.trim()))
  );
  const decline = useIntakeAction(() =>
    unwrap(adminManagedIntakeService.decline(intake.id, declineReason.trim()))
  );

  const s = intake.status;
  const open = ['SUBMITTED', 'ASSESSMENT_SCHEDULED', 'ASSESSED', 'PROPOSED'].includes(s);
  const stage = STAGE[s];

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{intake.propertyTitle}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{intake.propertyAddress}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Owner: <span className="text-foreground">{intake.ownerName ?? 'unknown'}</span>
            {intake.ownerEmail && <> · {intake.ownerEmail}</>} · asked{' '}
            {formatDate(intake.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={stage.variant}>{stage.label}</Badge>
          {!intake.propertyVerified && <Badge variant="warning">Ownership unverified</Badge>}
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Asked for</dt>
          <dd className="text-foreground">{TIER_LABEL[intake.requestedTier]}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Property</dt>
          <dd className="text-foreground">
            {CLASS_LABEL[intake.propertyClass] ?? intake.propertyClass} · {intake.occupiedUnits}/
            {intake.unitCount} occupied
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Rent roll (owner’s figure)</dt>
          <dd className="text-foreground">
            {intake.annualRentRoll
              ? `${formatCurrency(intake.annualRentRoll)} a year`
              : 'Not given'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Indicative fee</dt>
          <dd className="text-foreground">
            {intake.indicativeFeePct}%
            {intake.indicativeMonthlyFee !== null && (
              <> · {formatCurrency(intake.indicativeMonthlyFee)}/mo</>
            )}
          </dd>
        </div>
      </dl>
      {intake.serviceNeeds.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Needs: <span className="text-foreground">{intake.serviceNeeds.join(', ')}</span>
        </p>
      )}
      {intake.ownerNotes && (
        <p className="text-sm text-muted-foreground">
          Owner says: <span className="text-foreground">{intake.ownerNotes}</span>
        </p>
      )}

      {intake.assessmentScheduledFor && !intake.assessedAt && (
        <p className="text-sm text-muted-foreground">
          Visit:{' '}
          <span className="text-foreground">{lagosDateTime(intake.assessmentScheduledFor)}</span>{' '}
          with {intake.assessorName ?? 'an assessor'}
        </p>
      )}
      {intake.assessedAt && (
        <p className="text-sm text-muted-foreground">
          Assessed {formatDate(intake.assessedAt)} by {intake.assessorName ?? 'staff'}: condition{' '}
          <span className="text-foreground">{intake.condition?.toLowerCase()}</span>, risk{' '}
          <span className="text-foreground">{intake.risk?.toLowerCase()}</span>,{' '}
          <span className={intake.eligible ? 'text-success' : 'text-destructive'}>
            {intake.eligible ? 'eligible' : 'not eligible'}
          </span>
          . {intake.findings}
        </p>
      )}
      {intake.proposal && (
        <p className="text-sm text-muted-foreground">
          Proposed {intake.proposal.tierName} at {intake.proposal.feePct}%
          {intake.proposal.expiresAt && <>, valid to {formatDate(intake.proposal.expiresAt)}</>}
          {intake.proposalExpired && <span className="text-destructive"> (lapsed)</span>}
          {intake.proposal.exclusions && <>. Excludes: {intake.proposal.exclusions}</>}
        </p>
      )}
      {intake.openingPositionConfirmedAt && (
        <p className="text-sm text-muted-foreground">
          Opening position confirmed {formatDate(intake.openingPositionConfirmedAt)}:{' '}
          <span className="text-foreground">{intake.openingPositionNote}</span>
        </p>
      )}
      {s === 'ACCEPTED' && (
        <p className="text-sm text-muted-foreground">
          Accepted and signed. Activate it from GetRentos Managed once the checklist is complete.
        </p>
      )}
      {s === 'DECLINED' && (
        <p className="text-sm text-destructive">Declined: {intake.declinedReason}</p>
      )}

      {canOperate && (s === 'SUBMITTED' || s === 'ASSESSMENT_SCHEDULED') && (
        <Section title={s === 'SUBMITTED' ? 'Book the site visit' : 'Rebook the site visit'}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block sm:w-64">
              <span className="text-sm text-muted-foreground">Assessor</span>
              <div className="mt-1">
                <Select
                  ariaLabel="Assessor"
                  value={assessor}
                  onValueChange={setAssessor}
                  options={[{ value: '', label: 'Choose a staff member…' }, ...staffOptions]}
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm text-muted-foreground">Date</span>
              <div className="mt-1">
                <DatePicker
                  value={visitDate}
                  onChange={setVisitDate}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm text-muted-foreground">Time (Lagos)</span>
              <div className="mt-1">
                <TimePicker value={visitTime} onChange={setVisitTime} minHour={7} maxHour={19} />
              </div>
            </label>
            <Button
              isLoading={schedule.mutation.isPending}
              disabled={!assessor || !visitDate || !visitTime}
              onClick={() => schedule.mutation.mutate(undefined)}
            >
              Book visit
            </Button>
          </div>
          {schedule.error && <p className="mt-2 text-sm text-destructive">{schedule.error}</p>}
        </Section>
      )}

      {canOperate && (s === 'ASSESSMENT_SCHEDULED' || s === 'ASSESSED') && (
        <Section title={s === 'ASSESSED' ? 'Revise the assessment' : 'Record the assessment'}>
          <div className="grid gap-3 sm:grid-cols-4">
            <Select
              ariaLabel="Condition"
              value={condition}
              onValueChange={(v) => setCondition(v as typeof condition)}
              options={[
                { value: 'GOOD', label: 'Condition: good' },
                { value: 'FAIR', label: 'Condition: fair' },
                { value: 'POOR', label: 'Condition: poor' },
              ]}
            />
            <Select
              ariaLabel="Risk"
              value={risk}
              onValueChange={(v) => setRisk(v as typeof risk)}
              options={[
                { value: 'LOW', label: 'Risk: low' },
                { value: 'MEDIUM', label: 'Risk: medium' },
                { value: 'HIGH', label: 'Risk: high' },
              ]}
            />
            <Select
              ariaLabel="Eligible"
              value={eligible}
              onValueChange={setEligible}
              options={[
                { value: 'yes', label: 'Eligible' },
                { value: 'no', label: 'Not eligible' },
              ]}
            />
            <Select
              ariaLabel="Recommended tier"
              value={recommended}
              onValueChange={(v) => setRecommended(v as ManagedServicingTier)}
              options={TIER_OPTIONS}
            />
          </div>
          <textarea
            rows={3}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="What the visit found: state of the building, tenants, risks. At least 20 characters."
            className={textareaClass}
          />
          <Button
            className="mt-2"
            isLoading={assess.mutation.isPending}
            disabled={findings.trim().length < 20}
            onClick={() => assess.mutation.mutate(undefined)}
          >
            Save assessment
          </Button>
          {assess.error && <p className="mt-2 text-sm text-destructive">{assess.error}</p>}
        </Section>
      )}

      {canOperate && (s === 'ASSESSED' || s === 'PROPOSED') && intake.eligible && (
        <Section title={s === 'PROPOSED' ? 'Reissue the proposal' : 'Send the proposal'}>
          <div className="sm:w-72">
            <Select
              ariaLabel="Proposed tier"
              value={tier}
              onValueChange={(v) => setTier(v as ManagedServicingTier)}
              options={TIER_OPTIONS}
            />
          </div>
          <textarea
            rows={2}
            value={exclusions}
            onChange={(e) => setExclusions(e.target.value)}
            placeholder="Exclusions (optional), e.g. the generator house is not covered"
            className={textareaClass}
          />
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note to the owner (optional)"
            className={textareaClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The fee is the published one for the tier. Sending this is GetRentos accepting the
            property operationally. The owner has 14 days to accept.
          </p>
          <Button
            className="mt-2"
            isLoading={propose.mutation.isPending}
            onClick={() => propose.mutation.mutate(undefined)}
          >
            Send proposal
          </Button>
          {propose.error && <p className="mt-2 text-sm text-destructive">{propose.error}</p>}
        </Section>
      )}

      {canOperate && ['ASSESSED', 'PROPOSED', 'ACCEPTED'].includes(s) && (
        <Section title="Opening position">
          <textarea
            rows={2}
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            placeholder="Deposits and who holds them, arrears, open repairs. At least 20 characters."
            className={textareaClass}
          />
          <Button
            className="mt-2"
            variant="outline"
            isLoading={confirmOpening.mutation.isPending}
            disabled={opening.trim().length < 20}
            onClick={() => confirmOpening.mutation.mutate(undefined)}
          >
            {intake.openingPositionConfirmedAt ? 'Update' : 'Confirm opening position'}
          </Button>
          {confirmOpening.error && (
            <p className="mt-2 text-sm text-destructive">{confirmOpening.error}</p>
          )}
        </Section>
      )}

      {canOperate && open && (
        <Section title="Decline">
          <textarea
            rows={2}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="The reason the owner will see. At least 10 characters."
            className={textareaClass}
          />
          <Button
            className="mt-2"
            variant="danger"
            isLoading={decline.mutation.isPending}
            disabled={declineReason.trim().length < 10}
            onClick={() => decline.mutation.mutate(undefined)}
          >
            Decline request
          </Button>
          {decline.error && <p className="mt-2 text-sm text-destructive">{decline.error}</p>}
        </Section>
      )}
    </Card>
  );
};

export default function AdminManagedIntakesPage() {
  const user = useAdminUser();
  const canOperate = hasAdminPermission(user?.roles, 'managed.operate');
  const [filter, setFilter] = useState<Filter>('open');

  const intakes = useQuery({
    queryKey: ['admin', 'managed-intakes', filter],
    queryFn: () => unwrap(adminManagedIntakeService.list(filter === 'open' ? undefined : filter)),
  });
  const staff = useQuery({
    queryKey: ['admin', 'staff', 'for-managed'],
    queryFn: () => unwrap(adminService.listStaff({ pageSize: 100 })),
  });
  const staffOptions = useMemo(
    () =>
      (staff.data?.items ?? []).map((member) => ({
        value: member.id,
        label: member.email ? `${member.legalName} · ${member.email}` : member.legalName,
      })),
    [staff.data]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ClipboardCheck className="h-6 w-6 text-primary" aria-hidden />
          Managed intake
        </h1>
        <p className="mt-1 text-muted-foreground">
          Owners asking GetRentos to manage their property. Book the visit, record the assessment,
          send the proposal and confirm the opening position. Nothing activates until all of it is
          on record.
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="open">In progress</TabsTrigger>
          <TabsTrigger value="SUBMITTED">New</TabsTrigger>
          <TabsTrigger value="ASSESSMENT_SCHEDULED">Visits</TabsTrigger>
          <TabsTrigger value="PROPOSED">Proposals</TabsTrigger>
          <TabsTrigger value="DECLINED">Declined</TabsTrigger>
        </TabsList>
      </Tabs>

      {intakes.isError ? (
        <PageErrorState
          title="Could not load the intake pipeline"
          onRetry={() => void intakes.refetch()}
        />
      ) : intakes.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (intakes.data ?? []).length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing here"
          description="Requests from owners appear here as they come in."
        />
      ) : (
        <div className="space-y-4">
          {(intakes.data ?? []).map((intake) => (
            <IntakeCard
              key={intake.id}
              intake={intake}
              canOperate={canOperate}
              staffOptions={staffOptions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
