'use client';

import Link from 'next/link';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Briefcase,
  Building2,
  Check,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardSkeleton,
  EmptyState,
  ListSkeleton,
  Select,
  Textarea,
} from '@getrentos/ui';

import { landlordService } from '@/services/landlordService';
import {
  create as createMandate,
  managedFeeCard,
  managedSla,
  mine as myMandates,
  managedBreakFee,
  recordHandover,
  submit as submitMandate,
  terminate as terminateMandate,
  vettedFirms,
  type ManagedSlaTarget,
  type ManagedTierCard,
  type ManagementMandateDto,
  type ServicingTier,
  type VettedFirm,
} from '@/services/mandateService';
import {
  myIntakes,
  OPEN_INTAKE_STATUSES,
  type ManagedIntake,
} from '@/services/managedIntakeService';
import { unwrap } from '@/lib/apiHelpers';
import { ManagedIntakeDialog } from './ManagedIntakeDialog';
import { ManagedIntakePanel } from './ManagedIntakePanel';
import { formatCurrency } from '@/lib/format';

/**
 * "Let GetRentos manage it": the owner-facing opt-in.
 *
 * GetRentos as a manager is an ordinary mandate under the hood, so this screen
 * does not invent a new flow — it shows the published fee card and, for each of
 * the owner's properties, either where its managed engagement stands or a way to
 * start one. Starting one is an intake, not an opt-in: GetRentos visits, sends
 * a proposal, and the owner's acceptance is what signs the mandate.
 */

const MANDATE_STATUS_BADGE: Record<
  string,
  { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }
> = {
  DRAFT: { variant: 'neutral', label: 'Draft' },
  PENDING_OWNER: { variant: 'warning', label: 'Awaiting your signature' },
  PENDING_OPS: { variant: 'warning', label: 'With GetRentos for review' },
  ACTIVE: { variant: 'success', label: 'Managed by GetRentos' },
  SUSPENDED: { variant: 'warning', label: 'Paused' },
  TERMINATED: { variant: 'neutral', label: 'Ended' },
  EXPIRED: { variant: 'neutral', label: 'Expired' },
  REJECTED: { variant: 'danger', label: 'Declined' },
};

const TIER_LABEL: Record<ServicingTier, string> = {
  COLLECT_ONLY: 'Collect',
  COLLECT_MAINTAIN: 'Collect + Maintain',
  FULL_MANAGEMENT: 'Full management',
};

const ENDED_STATUSES = ['TERMINATED', 'EXPIRED', 'REJECTED'];

const INTAKE_STAGE: Record<string, string> = {
  SUBMITTED: 'Requested',
  ASSESSMENT_SCHEDULED: 'Visit booked',
  ASSESSED: 'Assessed',
  PROPOSED: 'Proposal ready',
};

/** Live = opted in, pending, or active — anything that is not an ended state. */
const isLiveEngagement = (m: ManagementMandateDto) => !ENDED_STATUSES.includes(m.status);

/** Terminated but the handover pack has not been exchanged yet — still winding down. */
const isWindingDown = (m: ManagementMandateDto) => m.status === 'TERMINATED' && !m.handoverAt;

const PRIORITY_LABEL: Record<ManagedSlaTarget['priority'], string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

/** Minutes as the span an owner reads — "1 hour", "48 hours", "5 days". */
const humanizeMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  const days = Math.round(minutes / 1440);
  return `${days} ${days === 1 ? 'day' : 'days'}`;
};

const FeeCardColumn = ({ card, highlight }: { card: ManagedTierCard; highlight: boolean }) => (
  <div
    className={`flex flex-col rounded-2xl border p-5 ${
      highlight ? 'border-primary bg-primary/5' : 'border-border bg-card'
    }`}
  >
    <h3 className="text-sm font-semibold text-foreground">{card.name}</h3>
    <p className="mt-2">
      <span className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
        {card.feePct}%
      </span>
      <span className="ml-1 text-sm text-muted-foreground">of rent collected</span>
    </p>
    <p className="mt-2 text-sm text-muted-foreground">{card.summary}</p>
    <ul className="mt-4 space-y-1.5">
      {card.includes.map((line) => (
        <li key={line} className="flex items-start gap-1.5 text-sm text-foreground">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
          {line}
        </li>
      ))}
    </ul>
    <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
      Letting {card.lettingCommissionPct}% · renewal {card.renewalCommissionPct}% commission
    </p>
  </div>
);

/**
 * Picker labels that tell properties apart: the name, then the address when two
 * share a name, then a number when even that is the same.
 */
function distinctLabels(
  list: { id: string; name: string; address?: string | null; city?: string | null }[]
) {
  const count = (keyOf: (p: (typeof list)[number]) => string) => {
    const seen = new Map<string, number>();
    for (const p of list) seen.set(keyOf(p), (seen.get(keyOf(p)) ?? 0) + 1);
    return seen;
  };
  const withPlace = (p: (typeof list)[number]) =>
    [p.name, [p.address, p.city].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  const names = count((p) => p.name);
  const places = count(withPlace);
  const nth = new Map<string, number>();
  const labels = new Map<string, string>();
  for (const p of list) {
    if ((names.get(p.name) ?? 0) < 2) {
      labels.set(p.id, p.name);
      continue;
    }
    const place = withPlace(p);
    if ((places.get(place) ?? 0) < 2) {
      labels.set(p.id, place);
      continue;
    }
    const n = (nth.get(place) ?? 0) + 1;
    nth.set(place, n);
    labels.set(p.id, `${place} (${n})`);
  }
  return labels;
}

export const GetRentosManagedView = () => {
  const queryClient = useQueryClient();
  const [intakeFor, setIntakeFor] = useState<{ id: string; name: string } | null>(null);
  const [firmPropertyByFirm, setFirmPropertyByFirm] = useState<Record<string, string>>({});
  const [endingId, setEndingId] = useState<string | null>(null);
  const [endReason, setEndReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const feeCard = useQuery({
    queryKey: ['managed', 'fee-card'],
    queryFn: () => unwrap(managedFeeCard()),
  });
  const properties = useQuery({
    queryKey: ['managed', 'properties'],
    queryFn: () => unwrap(landlordService.listProperties({ pageSize: 100 })),
  });
  const mandates = useQuery({
    queryKey: ['managed', 'mandates'],
    queryFn: () => unwrap(myMandates()),
  });
  const intakes = useQuery({
    queryKey: ['managed', 'intakes'],
    queryFn: () => unwrap(myIntakes()),
  });
  const sla = useQuery({
    queryKey: ['managed', 'sla'],
    queryFn: () => unwrap(managedSla()),
  });
  const firms = useQuery({
    queryKey: ['managed', 'firms'],
    queryFn: () => unwrap(vettedFirms()),
  });

  const appoint = useMutation({
    mutationFn: async ({ firmId, propertyId }: { firmId: string; propertyId: string }) => {
      const created = await unwrap(
        createMandate({
          propertyId,
          managerOrganizationId: firmId,
          scope: ['RENT', 'MAINTENANCE'],
        })
      );
      return unwrap(submitMandate(created.id));
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['managed', 'mandates'] });
    },
    onError: (err: Error) => setError(err.message || 'Could not appoint the firm.'),
  });

  const endEngagement = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(terminateMandate(id, reason)),
    onSuccess: () => {
      setError(null);
      setEndingId(null);
      setEndReason('');
      void queryClient.invalidateQueries({ queryKey: ['managed', 'mandates'] });
    },
    onError: (err: Error) => setError(err.message || 'Could not end the engagement.'),
  });

  const breakFeeQuery = useQuery({
    queryKey: ['managed', 'break-fee', endingId],
    queryFn: () => unwrap(managedBreakFee(endingId as string)),
    enabled: Boolean(endingId),
  });

  const handover = useMutation({
    mutationFn: (id: string) => unwrap(recordHandover(id)),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['managed', 'mandates'] });
    },
    onError: (err: Error) => setError(err.message || 'Could not record the handover.'),
  });

  // The current engagement for a property is its newest mandate (mine() is newest-first).
  const currentByProperty = new Map<string, ManagementMandateDto>();
  for (const m of mandates.data ?? []) {
    if (!currentByProperty.has(m.propertyId)) currentByProperty.set(m.propertyId, m);
  }
  /** A property is spoken for while a live mandate holds it, or a wind-down is mid-handover. */
  const committedProperties = new Set<string>();
  for (const [propertyId, m] of currentByProperty) {
    if (isLiveEngagement(m) || isWindingDown(m)) committedProperties.add(propertyId);
  }

  // The newest request per property (mine() is newest-first).
  const intakeByProperty = new Map<string, ManagedIntake>();
  for (const intake of intakes.data ?? []) {
    if (!intakeByProperty.has(intake.propertyId)) intakeByProperty.set(intake.propertyId, intake);
  }
  const refreshIntakes = () => {
    void queryClient.invalidateQueries({ queryKey: ['managed', 'intakes'] });
    void queryClient.invalidateQueries({ queryKey: ['managed', 'mandates'] });
  };

  const cards = feeCard.data ?? [];
  const propertyList = properties.data?.items ?? [];
  const pickerLabels = distinctLabels(propertyList);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Get your property managed</h1>
        <p className="mt-1 text-muted-foreground">
          Two ways to hand over the day-to-day. Either way, GetRentos holds the money and keeps the
          record, so the property&rsquo;s history stays with you.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/landlord/change-manager"
            className="font-medium text-primary hover:underline"
          >
            Already managed and want to move to someone else? Change manager →
          </Link>
        </p>
      </div>

      {/* Positioning: the two routes */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            Let GetRentos manage it
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We become the manager of record, with one published fee card and a service commitment
            you can hold us to, and an ops-assigned portfolio manager. Ask below: we visit, then
            send you a proposal to accept.
          </p>
        </div>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Briefcase className="h-5 w-5 text-muted-foreground" aria-hidden />
            Work with a vetted firm
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Appoint an independent agency you choose. You and the firm agree the terms; the
            engagement still runs on GetRentos. See the firms further down.
          </p>
        </Card>
      </div>

      {/* The GetRentos fee card */}
      {feeCard.isLoading ? (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} lines={4} />
          ))}
        </div>
      ) : (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <FeeCardColumn
              key={card.tier}
              card={card}
              highlight={card.tier === 'FULL_MANAGEMENT'}
            />
          ))}
        </div>
      )}

      {/* The owner's properties */}
      {/* The published service commitment */}
      {(sla.data ?? []).length > 0 && (
        <div className="mb-8 rounded-2xl border border-border bg-muted/30 p-5">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
            Our service commitment
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every managed property follows the same GetRentos SLA, not a partner&rsquo;s. These are
            the targets for maintenance, by how urgent the issue is.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(sla.data ?? []).map((row) => (
              <div key={row.priority} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {PRIORITY_LABEL[row.priority]}
                  </span>
                  {row.emergencyRoutingEnabled && <Badge variant="danger">Emergency</Badge>}
                </div>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Respond</dt>
                    <dd className="text-foreground">
                      {humanizeMinutes(row.responseTargetMinutes)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Resolve</dt>
                    <dd className="text-foreground">
                      {humanizeMinutes(row.resolutionTargetMinutes)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-foreground">Your properties</h2>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {properties.isLoading ? (
        <ListSkeleton variant="cards" rows={3} />
      ) : propertyList.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add a property first, then you can place it under GetRentos management."
        />
      ) : (
        <div className="space-y-3">
          {propertyList.map((property) => {
            const current = currentByProperty.get(property.id);
            const live = current && isLiveEngagement(current);
            const managed = current && live && current.managerIsGetRentos ? current : undefined;
            const firmMandate =
              current && live && !current.managerIsGetRentos ? current : undefined;
            const windingDown = current && isWindingDown(current) ? current : undefined;
            const intake = intakeByProperty.get(property.id);
            const openIntake =
              intake && OPEN_INTAKE_STATUSES.includes(intake.status) ? intake : undefined;
            // Accepted and signed, waiting on GetRentos to set it up and go live.
            const settingUp =
              managed && managed.status !== 'ACTIVE' && intake?.status === 'ACCEPTED'
                ? intake
                : undefined;
            const declined = !live && intake?.status === 'DECLINED' ? intake : undefined;
            const handoverBusy = handover.isPending && handover.variables === windingDown?.id;

            const activeMandate = managed ?? firmMandate;
            const isPendingMandate = activeMandate
              ? ['PENDING_OWNER', 'PENDING_OPS', 'DRAFT'].includes(activeMandate.status)
              : false;
            const endLabel = isPendingMandate ? 'Cancel request' : 'End management';
            const isEnding = Boolean(activeMandate) && endingId === activeMandate!.id;
            const endBusy =
              endEngagement.isPending && endEngagement.variables?.id === activeMandate?.id;

            return (
              <div key={property.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-xl bg-muted p-2.5">
                      <Building2 className="h-5 w-5 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{property.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {property.address}, {property.city}
                      </p>
                      {managed?.managerName && (
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                          <UserRound className="h-3.5 w-3.5" aria-hidden />
                          Portfolio manager: {managed.managerName}
                        </p>
                      )}
                      {managed?.deliveryPartnerName && (
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5" aria-hidden />
                          Delivered locally by {managed.deliveryPartnerName}
                        </p>
                      )}
                    </div>
                  </div>

                  {managed ? (
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      {managed.servicingTier && (
                        <span className="text-sm text-muted-foreground">
                          {TIER_LABEL[managed.servicingTier]}
                        </span>
                      )}
                      {settingUp ? (
                        <Badge variant="info">Being set up by GetRentos</Badge>
                      ) : (
                        <Badge variant={MANDATE_STATUS_BADGE[managed.status]?.variant ?? 'neutral'}>
                          {MANDATE_STATUS_BADGE[managed.status]?.label ?? managed.status}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-destructive"
                        onClick={() => {
                          setEndReason('');
                          setEndingId(isEnding ? null : managed.id);
                        }}
                      >
                        {endLabel}
                      </Button>
                    </div>
                  ) : firmMandate ? (
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {firmMandate.managerOrganizationName ?? 'A firm'}
                      </span>
                      <Badge variant={firmMandate.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {firmMandate.status === 'ACTIVE' ? 'Managed by firm' : 'Firm pending'}
                      </Badge>
                      {firmMandate.status === 'ACTIVE' && !openIntake && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => setIntakeFor({ id: property.id, name: property.name })}
                        >
                          Move to GetRentos
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-destructive"
                        onClick={() => {
                          setEndReason('');
                          setEndingId(isEnding ? null : firmMandate.id);
                        }}
                      >
                        {endLabel}
                      </Button>
                    </div>
                  ) : windingDown ? (
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <Badge variant="warning">Ending: handover due</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={handoverBusy}
                        onClick={() => handover.mutate(windingDown.id)}
                      >
                        Confirm handover
                      </Button>
                    </div>
                  ) : openIntake ? (
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <Badge variant={openIntake.status === 'PROPOSED' ? 'info' : 'warning'}>
                        {INTAKE_STAGE[openIntake.status]}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <Button
                        size="sm"
                        icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
                        onClick={() => setIntakeFor({ id: property.id, name: property.name })}
                      >
                        Ask GetRentos to manage
                      </Button>
                    </div>
                  )}
                </div>

                {(openIntake ?? settingUp) && (
                  <ManagedIntakePanel
                    intake={(openIntake ?? settingUp)!}
                    onChanged={refreshIntakes}
                  />
                )}
                {declined && !openIntake && (
                  <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                    GetRentos declined your last request: {declined.declinedReason}
                  </p>
                )}

                {isEnding && activeMandate && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground">
                      {isPendingMandate
                        ? 'Withdraw this request. Nothing has started, so there is nothing to settle.'
                        : 'End this engagement. The manager’s access stops immediately. GetRentos then prepares your final statement with rent collected to date, fees and any break fee. During handover, you and the manager exchange keys, balances and documents, then confirm completion here. GetRentos does not need to approve it.'}
                    </p>
                    {!isPendingMandate && breakFeeQuery.data && (
                      <Alert
                        variant={breakFeeQuery.data.waived ? 'neutral' : 'warning'}
                        className="mt-2"
                      >
                        {breakFeeQuery.data.waived
                          ? `No break fee. ${breakFeeQuery.data.reason}`
                          : `Notice-in-lieu of ${formatCurrency(breakFeeQuery.data.amount)} (${breakFeeQuery.data.reason}) will be added to your final statement.`}
                      </Alert>
                    )}
                    <Textarea
                      className="mt-2"
                      aria-label="Why you are ending it"
                      value={endReason}
                      onChange={(event) => setEndReason(event.target.value)}
                      rows={2}
                      placeholder="Why are you ending it? Enter at least 10 characters."
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={endReason.trim().length < 10}
                        isLoading={endBusy}
                        onClick={() =>
                          endEngagement.mutate({ id: activeMandate.id, reason: endReason.trim() })
                        }
                      >
                        {isPendingMandate ? 'Cancel the request' : 'End management'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEndingId(null)}
                        disabled={endBusy}
                      >
                        Keep it
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Work with a vetted firm — the other route */}
      <div className="mt-10">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Briefcase className="h-4 w-4 text-muted-foreground" aria-hidden />
          Vetted firms
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Independent agencies on GetRentos, ranked by their track record for handling maintenance
          on the properties they manage, then how much they run. Appoint one and it goes to them to
          accept, then to our team to verify before anything turns on.
        </p>

        {firms.isLoading ? (
          <ListSkeleton variant="cards" rows={2} className="mt-3" />
        ) : (firms.data ?? []).length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No vetted firms are listed yet"
            description="GetRentos Managed above is available now."
            size="compact"
            className="mt-3"
          />
        ) : (
          <div className="mt-3 space-y-3">
            {(firms.data ?? []).map((firm: VettedFirm, index: number) => {
              const canCompare = (firms.data ?? []).length >= 2;
              const openProperties = propertyList.filter((p) => !committedProperties.has(p.id));
              const chosen = firmPropertyByFirm[firm.id] ?? openProperties[0]?.id ?? '';
              const busy = appoint.isPending && appoint.variables?.firmId === firm.id;
              const onTime =
                firm.maintenance.slaOnTimeRate !== null
                  ? Math.round(firm.maintenance.slaOnTimeRate * 100)
                  : null;
              const since = new Date(firm.since).toLocaleDateString('en-NG', {
                month: 'short',
                year: 'numeric',
              });
              return (
                <div
                  key={firm.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-xl bg-muted p-2.5">
                      <Briefcase className="h-5 w-5 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{firm.name}</p>
                        {canCompare && index === 0 && (
                          <Badge variant="success" className="gap-1">
                            <Award className="h-3 w-3" aria-hidden />
                            Top ranked
                          </Badge>
                        )}
                        {canCompare && index > 0 && (
                          <span className="text-xs text-muted-foreground">#{firm.rank}</span>
                        )}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" aria-hidden />
                          {firm.teamSize} on the team
                        </span>
                        <span>
                          {firm.activeEngagements > 0
                            ? `Manages ${firm.activeEngagements} ${
                                firm.activeEngagements === 1 ? 'property' : 'properties'
                              } now`
                            : 'Not managing any yet'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wrench className="h-3.5 w-3.5" aria-hidden />
                          {onTime !== null
                            ? `${onTime}% of repairs on time${
                                firm.maintenance.averageResolutionDays !== null
                                  ? ` · ~${firm.maintenance.averageResolutionDays}d to resolve`
                                  : ''
                              }`
                            : 'No maintenance handled yet'}
                        </span>
                        <span>On GetRentos since {since}</span>
                      </p>
                    </div>
                  </div>

                  {openProperties.length === 0 ? (
                    <span className="text-sm text-muted-foreground sm:shrink-0">
                      All your properties are already assigned
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <div className="w-full min-w-0 sm:w-56">
                        <Select
                          ariaLabel={`Property to appoint ${firm.name} for`}
                          value={chosen}
                          onValueChange={(value) =>
                            setFirmPropertyByFirm((prev) => ({ ...prev, [firm.id]: value }))
                          }
                          options={openProperties.map((p) => ({
                            value: p.id,
                            label: pickerLabels.get(p.id) ?? p.name,
                          }))}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!chosen}
                        isLoading={busy}
                        icon={<Briefcase className="h-4 w-4" aria-hidden />}
                        aria-label={`Appoint ${firm.name}`}
                        onClick={() => appoint.mutate({ firmId: firm.id, propertyId: chosen })}
                      >
                        Appoint
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ManagedIntakeDialog
        property={intakeFor}
        cards={cards}
        onClose={() => setIntakeFor(null)}
        onSubmitted={() => {
          setIntakeFor(null);
          refreshIntakes();
        }}
      />
    </>
  );
};
