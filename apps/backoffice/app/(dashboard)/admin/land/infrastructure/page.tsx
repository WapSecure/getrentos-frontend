'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Construction } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { readLandApiError } from '@/lib/landDiligence';
import {
  adminLandInfrastructureService,
  landInfrastructureKeys,
  type AdminEstateChangeOrder,
  type AdminEstateCommitment,
} from '@/services/adminLandInfrastructureService';

const CHANGE_LABELS: Record<AdminEstateChangeOrder['kind'], string> = {
  DATE_CHANGE: 'New target date',
  SCOPE_CHANGE: 'Change in scope',
  WITHDRAWAL: 'Withdrawal',
};

type Action =
  | { kind: 'verify' | 'reject'; commitment: AdminEstateCommitment }
  | { kind: 'apply' | 'refuse'; order: AdminEstateChangeOrder }
  | null;

const ACTION_COPY = {
  verify: {
    title: 'Verify this delivery',
    description:
      'Buyers are told it is verified. Say what you checked (site visit, photos, certificate).',
    confirm: 'Verify',
    tone: 'primary',
  },
  reject: {
    title: 'Reject the delivery claim',
    description: 'The promise goes back to in progress and buyers and the developer are told why.',
    confirm: 'Reject claim',
    tone: 'danger',
  },
  apply: {
    title: 'Apply the change despite objections',
    description:
      'The new terms take effect and every buyer is told. Explain why the objections do not hold.',
    confirm: 'Apply change',
    tone: 'primary',
  },
  refuse: {
    title: 'Refuse the change',
    description: 'The original promise stands and the developer is told why.',
    confirm: 'Refuse change',
    tone: 'danger',
  },
} as const;

/** Estate infrastructure: delivery claims to check and change orders buyers objected to (LND-11). */
export default function AdminLandInfrastructurePage() {
  const user = useAdminUser();
  const queryClient = useQueryClient();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const canDecide = hasAdminPermission(user?.roles, 'verifications.approve');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [note, setNote] = useState('');
  const query = useQuery({
    queryKey: landInfrastructureKeys.queue,
    queryFn: () => unwrap(adminLandInfrastructureService.queue()),
    enabled: canView,
  });
  const act = useMutation({
    mutationFn: (current: NonNullable<Action>) => {
      switch (current.kind) {
        case 'verify':
          return unwrap(adminLandInfrastructureService.verify(current.commitment.id, note));
        case 'reject':
          return unwrap(adminLandInfrastructureService.reject(current.commitment.id, note));
        case 'apply':
          return unwrap(adminLandInfrastructureService.decide(current.order.id, 'APPLY', note));
        case 'refuse':
          return unwrap(adminLandInfrastructureService.decide(current.order.id, 'REJECT', note));
      }
    },
    onSuccess: (next) => {
      queryClient.setQueryData(landInfrastructureKeys.queue, next);
      setToast({ message: 'Done; buyers and the developer were told.', variant: 'success' });
    },
    onError: (e) =>
      setToast({ message: readLandApiError(e, 'Could not save that.').message, variant: 'error' }),
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to estate infrastructure"
        description="This needs the verifications review permission."
      />
    );
  }
  const commitments = query.data?.commitments ?? [];
  const orders = query.data?.changeOrders ?? [];
  const copy = action ? ACTION_COPY[action.kind] : null;

  return (
    <>
      <div className="mb-6">
        <h1 className="type-title">Estate infrastructure</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Developers&apos; delivery claims waiting for a check, and changes to promises that buyers
          objected to. Nothing shows as verified, and no objected change applies, until you decide.
        </p>
      </div>
      {query.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : commitments.length === 0 && orders.length === 0 ? (
        <EmptyState
          icon={Construction}
          title="Nothing to review"
          description="Delivery claims and contested changes appear here."
        />
      ) : (
        <div className="space-y-8">
          {commitments.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Delivery claims</h2>
              <ul className="space-y-4">
                {commitments.map((c) => (
                  <li key={c.id}>
                    <Card className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {c.estate} · {c.kindLabel}
                          </p>
                          <p className="font-medium text-foreground">{c.title}</p>
                        </div>
                        <Badge variant={c.status === 'DISPUTED' ? 'danger' : 'warning'}>
                          {c.status === 'DISPUTED' ? 'Disputed by a buyer' : 'Reported delivered'}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {c.targetDate ? `Target ${formatDate(c.targetDate)} · ` : ''}
                        {c.evidenceCount} evidence {c.evidenceCount === 1 ? 'file' : 'files'} on the
                        estate property
                      </p>
                      {c.updates && c.updates.length > 0 && (
                        <ol className="mt-3 space-y-2 border-l border-border pl-4">
                          {c.updates.map((u, i) => (
                            <li key={`${u.at}-${i}`} className="text-sm">
                              <p className="text-foreground">{u.note}</p>
                              <p className="text-xs text-muted-foreground">
                                {u.byName} ({u.byRole.toLowerCase()}) · {formatDate(u.at)}
                                {u.hasEvidence && ' · evidence attached'}
                              </p>
                            </li>
                          ))}
                        </ol>
                      )}
                      {canDecide && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => setAction({ kind: 'verify', commitment: c })}
                          >
                            Verify delivery
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAction({ kind: 'reject', commitment: c })}
                          >
                            Reject claim
                          </Button>
                        </div>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {orders.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Contested changes</h2>
              <ul className="space-y-4">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Card className="p-5">
                      <p className="text-xs text-muted-foreground">
                        {o.estate} · {CHANGE_LABELS[o.kind]}
                      </p>
                      <p className="font-medium text-foreground">{o.commitment}</p>
                      {o.newTargetDate && (
                        <p className="mt-2 text-sm text-foreground">
                          New target: {formatDate(o.newTargetDate)}
                        </p>
                      )}
                      {o.newDescription && (
                        <p className="mt-2 text-sm text-foreground">
                          Would deliver: {o.newDescription}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Developer&apos;s reason: {o.reason}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {o.acknowledged} acknowledged · {o.objections.length} objected · answers
                        close {formatDate(o.respondBy)}
                      </p>
                      <ul className="mt-3 space-y-2">
                        {o.objections.map((text, i) => (
                          <li
                            key={i}
                            className="whitespace-pre-line rounded-xl bg-secondary/50 p-3 text-sm text-foreground"
                          >
                            {text}
                          </li>
                        ))}
                      </ul>
                      {canDecide && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAction({ kind: 'refuse', order: o })}
                          >
                            Refuse change
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAction({ kind: 'apply', order: o })}
                          >
                            Apply anyway
                          </Button>
                        </div>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setNote('');
          }
        }}
        title={copy?.title ?? ''}
        description={copy?.description ?? ''}
        confirmLabel={copy?.confirm}
        tone={copy?.tone}
        promptLabel="Note"
        promptValue={note}
        onPromptChange={setNote}
        promptRequired
        promptMinLength={5}
        isLoading={act.isPending}
        onConfirm={() => (action ? act.mutateAsync(action) : undefined)}
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
