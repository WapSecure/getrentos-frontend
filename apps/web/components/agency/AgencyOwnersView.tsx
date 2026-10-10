'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRound, Building2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { useCustody } from './CustodyProvider';
import {
  isLive,
  MANDATE_STATUS_LABELS,
  type ManagementMandateDto,
  type MandateStatus,
} from '@/services/mandateService';

const STATUS_VARIANT: Partial<Record<MandateStatus, BadgeVariant>> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  PENDING_OWNER: 'info',
  PENDING_OPS: 'info',
  DRAFT: 'neutral',
  TERMINATED: 'neutral',
  EXPIRED: 'neutral',
  REJECTED: 'danger',
};

interface OwnerGroup {
  ownerId: string;
  ownerName: string;
  mandates: ManagementMandateDto[];
  liveCount: number;
}

/**
 * The firm's whole book, grouped by the client it belongs to.
 *
 * The custody bar answers "who am I acting for right now?" for a single property;
 * this answers "who are all my clients, and what do I run for each?". Choosing a
 * property here sets custody and drops into that client's workspace, so the
 * one-client discipline still holds once you are working.
 */
export function AgencyOwnersView() {
  const router = useRouter();
  const { mandates, loading, error, select } = useCustody();

  const groups = useMemo<OwnerGroup[]>(() => {
    const byOwner = new Map<string, OwnerGroup>();
    for (const mandate of mandates) {
      const group = byOwner.get(mandate.ownerId) ?? {
        ownerId: mandate.ownerId,
        ownerName: mandate.ownerName ?? 'Owner',
        mandates: [],
        liveCount: 0,
      };
      group.mandates.push(mandate);
      if (isLive(mandate)) group.liveCount += 1;
      byOwner.set(mandate.ownerId, group);
    }
    return [...byOwner.values()].sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  }, [mandates]);

  const openProperty = (mandate: ManagementMandateDto) => {
    select(mandate.id);
    router.push('/agency');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading your clients…
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 flex items-center gap-2 rounded-xl border border-border bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        We could not load your clients ({error}).
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <p className="mt-1 text-muted-foreground">
          {groups.length === 0
            ? 'The owners whose properties you manage will appear here.'
            : `${groups.length} owner${groups.length === 1 ? '' : 's'} across ${mandates.length} propert${mandates.length === 1 ? 'y' : 'ies'}.`}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <UserRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No client engagements yet.</p>
          <Link
            href="/agency/mandates"
            className="mt-2 inline-block font-medium text-primary hover:underline"
          >
            Manage mandates
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {groups.map((group) => (
            <div key={group.ownerId} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <UserRound className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="truncate font-semibold text-foreground">{group.ownerName}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {group.mandates.length} propert{group.mandates.length === 1 ? 'y' : 'ies'}
                  {group.liveCount < group.mandates.length ? ` · ${group.liveCount} live` : ''}
                </span>
              </div>
              <div className="divide-y divide-border/60">
                {group.mandates.map((mandate) => (
                  <button
                    key={mandate.id}
                    type="button"
                    onClick={() => openProperty(mandate)}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:text-primary cursor-pointer"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate text-sm text-foreground">
                        {mandate.propertyTitle ?? 'Property'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {!isLive(mandate) && (
                        <Badge variant={STATUS_VARIANT[mandate.status] ?? 'neutral'}>
                          {MANDATE_STATUS_LABELS[mandate.status]}
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
