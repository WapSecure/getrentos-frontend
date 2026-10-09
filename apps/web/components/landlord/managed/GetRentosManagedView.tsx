'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, Clock, Loader2, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@getrentos/ui';

import { landlordService } from '@/services/landlordService';
import {
  managedFeeCard,
  managedSla,
  mine as myMandates,
  optIntoManaged,
  type ManagedSlaTarget,
  type ManagedTierCard,
  type ManagementMandateDto,
  type ServicingTier,
} from '@/services/mandateService';
import { unwrap } from '@/lib/apiHelpers';

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

/** A mandate counts as the live GetRentos engagement for a property unless it has ended. */
const isLiveManaged = (m: ManagementMandateDto) =>
  m.managerIsGetRentos && !['TERMINATED', 'EXPIRED', 'REJECTED'].includes(m.status);

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

  const optIn = useMutation({
    mutationFn: ({ propertyId, tier }: { propertyId: string; tier: ServicingTier }) =>
      unwrap(optIntoManaged(propertyId, tier)),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['managed', 'mandates'] });
    },
    onError: (err: Error) => setError(err.message || 'Could not opt into GetRentos Managed.'),
  });

  const managedByProperty = new Map<string, ManagementMandateDto>();
  for (const m of mandates.data ?? []) {
    if (isLiveManaged(m)) managedByProperty.set(m.propertyId, m);
  }

  const cards = feeCard.data ?? [];
  const propertyList = properties.data?.items ?? [];

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden />
          GetRentos Managed
        </h1>
        <p className="mt-1 text-muted-foreground">
          Let GetRentos run your property — vetted, accountable, and on one published fee card. Pick
          a service level; our ops team reviews and activates it.
        </p>
      </div>

      {/* The fee card */}
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
            const managed = managedByProperty.get(property.id);
            const selected = tierByProperty[property.id] ?? 'FULL_MANAGEMENT';
            const busy = optIn.isPending && optIn.variables?.propertyId === property.id;

            return (
              <div
                key={property.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
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
            );
          })}
        </div>
      )}
    </>
  );
};
