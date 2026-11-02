'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, FileSignature, Lock, ShieldCheck, UserRound } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageErrorState } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { mandateKeys } from '@/lib/queryKeys';
import * as mandateService from '@/services/mandateService';
import {
  MANDATE_SCOPE_LABELS,
  MANDATE_STATUS_LABELS,
  formatDay,
  grantsNothing,
  isLive,
  noticeSummary,
  type ManagementMandateDto,
  type MandateStatus,
} from '@/services/mandateService';
import { MandateActionButtons } from './MandateActionButtons';
import { useMandateActions, type ReasonAction, type SimpleAction } from './useMandateActions';

/**
 * The engagements a firm holds, and what can be done to each one.
 *
 * This screen exists because a mandate has a lifecycle and the API has eighteen
 * routes for it, and until now none of them had a face. The lifecycle is the point:
 * a mandate provisions nothing until BOTH parties have signed and GetRentos has
 * verified it, so "why can I not do anything yet" is the question this screen is
 * mostly answering.
 *
 * Actions are shown from the permission set the API returns with the mandate,
 * not from its status. Status alone is not enough: whether a caller may pause an
 * engagement depends on who they are, which the screen cannot work out from a
 * status field. Deriving it here would restate rules the API already enforces,
 * and the two would drift — which is exactly how this screen came to offer
 * "Pause" to managers the API then refused.
 *
 * Where an action needs a reason, it needs a real one — the backend requires at
 * least ten characters, since a second person may have to decide on it.
 */

const STATUS_VARIANT: Record<MandateStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> =
  {
    DRAFT: 'neutral',
    PENDING_OWNER: 'info',
    PENDING_OPS: 'info',
    ACTIVE: 'success',
    SUSPENDED: 'warning',
    TERMINATED: 'neutral',
    EXPIRED: 'neutral',
    REJECTED: 'danger',
  };

/** The actions that end or pause an engagement, each with the reason it needs. */

export function MandateListView() {
  const queryClient = useQueryClient();
  const { act, runSimple, askReason, dialog } = useMandateActions();

  const { data, isLoading, error } = useQuery({
    queryKey: mandateKeys.managing,
    queryFn: () => unwrap(mandateService.managing()),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: mandateKeys.managing });
    void queryClient.invalidateQueries({ queryKey: mandateKeys.mine });
  };

  if (error) {
    return <PageErrorState description={(error as Error).message} onRetry={invalidate} />;
  }

  const mandates = data ?? [];
  const live = mandates.filter(isLive);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="h-6 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-4">
          {[0, 1].map((row) => (
            <div key={row} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">Client engagements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {live.length > 0
              ? `${live.length} you can act under right now.`
              : 'A mandate lets you act for a property you do not own.'}
          </p>
        </div>
        <Button variant="outline" href="/agency">
          Go to the workspace
        </Button>
      </header>

      {act.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {(act.error as Error).message}
        </div>
      )}

      {mandates.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No client engagements yet"
          description="An owner appoints you, or you ask to be appointed, and the engagement starts once both sides have signed and GetRentos has verified it."
        />
      ) : (
        <ul className="space-y-4">
          {mandates.map((mandate) => (
            <li key={mandate.id}>
              <MandateCard
                mandate={mandate}
                busy={act.isPending}
                onSimple={runSimple}
                onReason={askReason}
              />
            </li>
          ))}
        </ul>
      )}

      {dialog}
    </div>
  );
}

function MandateCard({
  mandate,
  busy,
  onSimple,
  onReason,
}: {
  mandate: ManagementMandateDto;
  busy: boolean;
  onSimple: (mandate: ManagementMandateDto, action: SimpleAction) => void;
  onReason: (mandate: ManagementMandateDto, action: ReasonAction) => void;
}) {
  const live = isLive(mandate);

  return (
    <Card static className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="font-medium">{mandate.propertyTitle ?? 'Property'}</span>
            <Badge variant={STATUS_VARIANT[mandate.status]}>
              {MANDATE_STATUS_LABELS[mandate.status]}
            </Badge>
            {live && <Badge variant="success">In force</Badge>}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" aria-hidden />
            {mandate.ownerName ?? 'the owner'}
            <span aria-hidden>·</span>
            {mandate.managerIsGetRentos
              ? 'GetRentos is the manager'
              : (mandate.managerOrganizationName ?? mandate.managerName ?? 'the manager')}
            <span aria-hidden>·</span>
            {noticeSummary(mandate)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Started {formatDay(mandate.activatedAt ?? mandate.startAt)} ·{' '}
            {mandate.signedByOwnerAt ? 'signed by the owner' : 'owner has not signed'} ·{' '}
            {mandate.signedByManagerAt ? 'signed by the manager' : 'manager has not signed'}
          </p>
        </div>

        <Link
          href={`/agency/mandates/${mandate.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Details
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {mandate.scope.map((scope) => (
          <span
            key={scope}
            title={MANDATE_SCOPE_LABELS[scope]}
            className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
          >
            {scope}
          </span>
        ))}
        <CapabilityChip on={mandate.capabilities.canList} label="list" />
        <CapabilityChip on={mandate.capabilities.canManage} label="manage" />
        <CapabilityChip on={mandate.capabilities.canTransact} label="money" />
      </div>

      {grantsNothing(mandate) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          This scope grants no access yet, so the workspace will look empty. That is the scope, not
          missing data.
        </p>
      )}

      <MandateActionButtons mandate={mandate} busy={busy} onSimple={onSimple} onReason={onReason} />
      {mandate.status === 'PENDING_OPS' && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Both sides have signed. A GetRentos officer still has to verify it before you can act.
        </p>
      )}
    </Card>
  );
}

function CapabilityChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        on
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground line-through'
      }`}
    >
      {label}
    </span>
  );
}
