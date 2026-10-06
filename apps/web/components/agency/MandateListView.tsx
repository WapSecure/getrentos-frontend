'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  FileSignature,
  Handshake,
  Lock,
  Pause,
  Play,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageErrorState } from '@getrentos/ui';
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

/**
 * The engagements a firm holds, and what can be done to each one.
 *
 * This screen exists because a mandate has a lifecycle and the API has eighteen
 * routes for it, and until now none of them had a face. The lifecycle is the point:
 * a mandate provisions nothing until BOTH parties have signed and GetRentos has
 * verified it, so "why can I not do anything yet" is the question this screen is
 * mostly answering.
 *
 * Actions are shown by status rather than all at once, because most of them are
 * invalid most of the time and an enabled button that answers 409 teaches nobody
 * anything. Where an action needs a reason, it needs a real one — the backend
 * requires at least ten characters, since a second person may have to decide on it.
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
type ReasonAction = 'notice' | 'terminate' | 'suspend' | 'request-termination';

const REASON_ACTIONS: Record<
  ReasonAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
    promptLabel: string;
    needsReason: boolean;
  }
> = {
  notice: {
    title: 'Serve notice?',
    description:
      'This records the date your notice clock started. The engagement keeps running until the ' +
      'agreed notice period has passed — it does not end the mandate today, and it cannot be ' +
      'back-dated.',
    confirmLabel: 'Serve notice',
    promptLabel: '',
    needsReason: false,
  },
  terminate: {
    title: 'End this engagement?',
    description:
      'This ends the mandate and revokes your access to the property immediately. The owner is ' +
      'notified. Ending it before the notice period has run is allowed, but you have to say why, ' +
      'and that goes on the record.',
    confirmLabel: 'End the mandate',
    promptLabel: 'Why is this ending early, or before notice has run?',
    needsReason: true,
  },
  suspend: {
    title: 'Pause this engagement?',
    description:
      'Your access is revoked but the agreement stays, so resuming does not need it re-signing. ' +
      'Use this when something needs resolving rather than ending.',
    confirmLabel: 'Pause',
    promptLabel: 'What needs resolving?',
    needsReason: true,
  },
  'request-termination': {
    title: 'Ask GetRentos to end this engagement?',
    description:
      'This raises a request, not an ending. The mandate keeps running and your access stays ' +
      'while it is open, and a second GetRentos staff member has to approve it — no one person ' +
      'ends a client engagement alone.',
    confirmLabel: 'Raise the request',
    promptLabel: 'Why should this engagement end?',
    needsReason: true,
  },
};

export function MandateListView() {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<{
    mandate: ManagementMandateDto;
    action: ReasonAction;
  } | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: mandateKeys.managing,
    queryFn: () => unwrap(mandateService.managing()),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: mandateKeys.managing });
    void queryClient.invalidateQueries({ queryKey: mandateKeys.mine });
  };

  const act = useMutation({
    mutationFn: async (input: {
      mandate: ManagementMandateDto;
      action: ReasonAction | 'submit' | 'sign' | 'resume' | 'handover';
      reason?: string;
    }) => {
      const { mandate, action } = input;
      const service = mandateService;
      switch (action) {
        case 'submit':
          return unwrap(service.submit(mandate.id));
        case 'sign':
          // The side is inferred from who is calling, so the UI cannot sign for
          // the other party even if it tried.
          return unwrap(service.sign(mandate.id));
        case 'notice':
          return unwrap(service.serveNotice(mandate.id));
        case 'terminate':
          return unwrap(service.terminate(mandate.id, input.reason ?? ''));
        case 'suspend':
          return unwrap(service.suspend(mandate.id, input.reason ?? ''));
        case 'resume':
          return unwrap(service.resume(mandate.id));
        case 'handover':
          return unwrap(service.recordHandover(mandate.id));
        case 'request-termination':
          return unwrap(service.requestTermination(mandate.id, input.reason ?? ''));
      }
    },
    onSuccess: () => {
      invalidate();
      setPendingAction(null);
      setReason('');
    },
  });

  const runSimple = (
    mandate: ManagementMandateDto,
    action: 'submit' | 'sign' | 'resume' | 'handover'
  ) => act.mutate({ mandate, action });

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
                onReason={(action) => {
                  setReason('');
                  setPendingAction({ mandate, action });
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {pendingAction && (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingAction(null);
          }}
          title={REASON_ACTIONS[pendingAction.action].title}
          description={REASON_ACTIONS[pendingAction.action].description}
          confirmLabel={REASON_ACTIONS[pendingAction.action].confirmLabel}
          isLoading={act.isPending}
          promptLabel={
            REASON_ACTIONS[pendingAction.action].needsReason
              ? REASON_ACTIONS[pendingAction.action].promptLabel
              : undefined
          }
          promptPlaceholder={
            REASON_ACTIONS[pendingAction.action].needsReason
              ? 'At least 10 characters — whoever has to decide will read this'
              : undefined
          }
          promptValue={reason}
          onPromptChange={setReason}
          promptRequired={REASON_ACTIONS[pendingAction.action].needsReason}
          promptMinLength={10}
          onConfirm={() =>
            act.mutate({
              mandate: pendingAction.mandate,
              action: pendingAction.action,
              reason,
            })
          }
        />
      )}
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
  onSimple: (
    mandate: ManagementMandateDto,
    action: 'submit' | 'sign' | 'resume' | 'handover'
  ) => void;
  onReason: (action: ReasonAction) => void;
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

      <div className="mt-3 flex flex-wrap gap-2">
        {mandate.status === 'DRAFT' && (
          <Button size="sm" disabled={busy} onClick={() => onSimple(mandate, 'submit')}>
            <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Send to the owner
          </Button>
        )}
        {mandate.status === 'PENDING_OWNER' && (
          <Button size="sm" disabled={busy} onClick={() => onSimple(mandate, 'sign')}>
            <FileSignature className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Sign
          </Button>
        )}
        {live && (
          <>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onReason('notice')}>
              Serve notice
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onReason('suspend')}>
              <Pause className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Pause
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onSimple(mandate, 'handover')}
            >
              <Handshake className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Record handover
            </Button>
          </>
        )}
        {mandate.status === 'SUSPENDED' && (
          <Button size="sm" disabled={busy} onClick={() => onSimple(mandate, 'resume')}>
            <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Resume
          </Button>
        )}
        {!['TERMINATED', 'EXPIRED', 'REJECTED'].includes(mandate.status) && (
          <Button
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={() =>
              onReason(mandate.managerIsGetRentos ? 'request-termination' : 'terminate')
            }
          >
            End engagement
          </Button>
        )}
      </div>

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
