'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Briefcase,
  Building2,
  Check,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { Badge } from '@getrentos/ui';

import { landlordService } from '@/services/landlordService';
import {
  create as createMandate,
  managedFeeCard,
  managedSla,
  mine as myMandates,
  managedBreakFee,
  optIntoManaged,
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
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';

/**
 * "Let GetRentos manage it": the owner-facing opt-in.
 *
 * GetRentos as a manager is an ordinary mandate under the hood, so this screen
 * does not invent a new flow — it shows the published fee card and, for each of
 * the owner's properties, either where its managed engagement stands or a way to
 * start one. Opting in is a request: it lands with ops for review and signing,
 * which is why a fresh opt-in shows as pending rather than active.
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

export const GetRentosManagedView = () => {
  const queryClient = useQueryClient();
  const [tierByProperty, setTierByProperty] = useState<Record<string, ServicingTier>>({});
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
  const sla = useQuery({
    queryKey: ['managed', 'sla'],
    queryFn: () => unwrap(managedSla()),
  });
  const firms = useQuery({
    queryKey: ['managed', 'firms'],
    queryFn: () => unwrap(vettedFirms()),
  });

  const optIn = useMutation({
    mutationFn: ({ propertyId, tier }: { propertyId: string; tier: ServicingTier }) =>
      unwrap(optIntoManaged(propertyId, tier)),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['managed', 'mandates'] });
    },
    onError: (err: Error) => setError(err.message || 'Could not opt into GetRentos Managed.'),
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

  const cards = feeCard.data ?? [];
  const propertyList = properties.data?.items ?? [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Get your property managed</h1>
        <p className="mt-1 text-muted-foreground">
          Two ways to hand over the day-to-day. Either way, GetRentos holds the money and keeps the
          record, so the property&rsquo;s history stays with you.
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
            We become the manager of record — one published fee card, a service commitment you can
            hold us to, and an ops-assigned portfolio manager. Pick a tier below.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Briefcase className="h-5 w-5 text-muted-foreground" aria-hidden />
            Work with a vetted firm
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Appoint an independent agency you choose. You and the firm agree the terms; the
            engagement still runs on GetRentos. See the firms further down.
          </p>
        </div>
      </div>

      {/* The GetRentos fee card */}
      {feeCard.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading the fee card…</p>
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
            Every managed property is held to the same GetRentos SLA — not a partner&rsquo;s. These
            are the targets for maintenance, by how urgent the issue is.
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
        <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {properties.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your properties…</p>
      ) : propertyList.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="font-medium text-foreground">No properties yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Add a property first, then you can place it under GetRentos management.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {propertyList.map((property) => {
            const current = currentByProperty.get(property.id);
            const live = current && isLiveEngagement(current);
            const managed = current && live && current.managerIsGetRentos ? current : undefined;
            const firmMandate =
              current && live && !current.managerIsGetRentos ? current : undefined;
            const windingDown = current && isWindingDown(current) ? current : undefined;
            const selected = tierByProperty[property.id] ?? 'FULL_MANAGEMENT';
            const busy = optIn.isPending && optIn.variables?.propertyId === property.id;
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
                    </div>
                  </div>

                  {managed ? (
                    <div className="flex items-center gap-2 sm:shrink-0">
                      {managed.servicingTier && (
                        <span className="text-sm text-muted-foreground">
                          {TIER_LABEL[managed.servicingTier]}
                        </span>
                      )}
                      <Badge variant={MANDATE_STATUS_BADGE[managed.status]?.variant ?? 'neutral'}>
                        {MANDATE_STATUS_BADGE[managed.status]?.label ?? managed.status}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setEndReason('');
                          setEndingId(isEnding ? null : managed.id);
                        }}
                        className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:text-destructive"
                      >
                        {endLabel}
                      </button>
                    </div>
                  ) : firmMandate ? (
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {firmMandate.managerOrganizationName ?? 'A firm'}
                      </span>
                      <Badge variant={firmMandate.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {firmMandate.status === 'ACTIVE' ? 'Managed by firm' : 'Firm pending'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setEndReason('');
                          setEndingId(isEnding ? null : firmMandate.id);
                        }}
                        className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:text-destructive"
                      >
                        {endLabel}
                      </button>
                    </div>
                  ) : windingDown ? (
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <Badge variant="warning">Ending — handover due</Badge>
                      <button
                        type="button"
                        disabled={handoverBusy}
                        onClick={() => handover.mutate(windingDown.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
                      >
                        {handoverBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                        Confirm handover
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <select
                        aria-label={`Service level for ${property.name}`}
                        value={selected}
                        onChange={(event) =>
                          setTierByProperty((prev) => ({
                            ...prev,
                            [property.id]: event.target.value as ServicingTier,
                          }))
                        }
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {cards.map((card) => (
                          <option key={card.tier} value={card.tier}>
                            {card.name} — {card.feePct}%
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => optIn.mutate({ propertyId: property.id, tier: selected })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <ShieldCheck className="h-4 w-4" aria-hidden />
                        )}
                        Request
                      </button>
                    </div>
                  )}
                </div>

                {isEnding && activeMandate && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground">
                      {isPendingMandate
                        ? 'Withdraw this request. Nothing has started, so there is nothing to settle — it just goes away.'
                        : 'End this engagement. The manager’s access stops immediately, and GetRentos draws up your final statement — rent collected to date, fees and any break fee. It then moves to handover: you and the manager exchange keys, balances and documents, and you confirm that here. GetRentos does not have to approve it.'}
                    </p>
                    {!isPendingMandate && breakFeeQuery.data && (
                      <p
                        className={`mt-2 rounded-lg border px-3 py-2 text-sm ${
                          breakFeeQuery.data.waived
                            ? 'border-border bg-muted/40 text-muted-foreground'
                            : 'border-warning/30 bg-warning-subtle text-foreground'
                        }`}
                      >
                        {breakFeeQuery.data.waived
                          ? `No break fee — ${breakFeeQuery.data.reason}`
                          : `Notice-in-lieu of ${formatCurrency(breakFeeQuery.data.amount)} (${breakFeeQuery.data.reason}) will be added to your final statement.`}
                      </p>
                    )}
                    <textarea
                      value={endReason}
                      onChange={(event) => setEndReason(event.target.value)}
                      rows={2}
                      placeholder="Why are you ending it? (at least 10 characters — it is kept on the record)"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={endBusy || endReason.trim().length < 10}
                        onClick={() =>
                          endEngagement.mutate({ id: activeMandate.id, reason: endReason.trim() })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
                      >
                        {endBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                        {isPendingMandate ? 'Cancel the request' : 'End management'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEndingId(null)}
                        disabled={endBusy}
                        className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        Keep it
                      </button>
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
          Independent agencies on GetRentos, ranked by a real track record — how they handle
          maintenance on the properties they manage, then how much they run. Appoint one and it goes
          to them to accept, then to our team to verify before anything turns on.
        </p>

        {firms.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading firms…</p>
        ) : (firms.data ?? []).length === 0 ? (
          <div className="mt-3 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No vetted firms are listed yet. GetRentos Managed above is available now.
            </p>
          </div>
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
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <select
                        aria-label={`Property to appoint ${firm.name} for`}
                        value={chosen}
                        onChange={(event) =>
                          setFirmPropertyByFirm((prev) => ({
                            ...prev,
                            [firm.id]: event.target.value,
                          }))
                        }
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {openProperties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy || !chosen}
                        onClick={() => appoint.mutate({ firmId: firm.id, propertyId: chosen })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Briefcase className="h-4 w-4" aria-hidden />
                        )}
                        Appoint
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
