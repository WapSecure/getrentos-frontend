'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Gavel, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, Button, Textarea } from '@getrentos/ui';
import { cn, formatDate, unwrap } from '@getrentos/shared';
import { trustService } from '@/services/trustService';
import { adminKeys } from '@/lib/queryKeys';
import type { TrustAppeal, TrustAppealDecision } from '@/types/trust';
import { APPEAL_STATUS_META, APPEAL_TARGET_META } from './AppealCard';

const shortId = (id?: string | null) => (id ? `${id.slice(0, 8)}…` : '—');

interface AppealResolveModalProps {
  appeal: TrustAppeal | null;
  onClose: () => void;
}

/**
 * Resolve a trust appeal (TG-06). The reviewer upholds the original decision or
 * overturns it; overturning reopens the target for a fresh review. The backend
 * refuses a reviewer who was the original decision-maker, so the UI surfaces that
 * error rather than pre-judging it.
 */
export const AppealResolveModal = ({ appeal, onClose }: AppealResolveModalProps) => {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<TrustAppealDecision | ''>('');
  const [resolution, setResolution] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const resolveMutation = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.resolveAppeal(appeal!.id, {
          decision: decision as TrustAppealDecision,
          resolution: resolution.trim() || undefined,
        })
      ),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: adminKeys.trustAppeals });
      handleClose();
    },
    onError: (reason) =>
      setActionError(reason instanceof Error ? reason.message : 'Unable to resolve this appeal.'),
  });

  const handleClose = () => {
    if (resolveMutation.isPending) return;
    setDecision('');
    setResolution('');
    setActionError(null);
    onClose();
  };

  const target = appeal
    ? (APPEAL_TARGET_META[appeal.targetType] ?? { label: appeal.targetType, icon: Gavel })
    : null;
  const status = appeal ? APPEAL_STATUS_META[appeal.status] : null;

  return (
    <Dialog open={Boolean(appeal)} onOpenChange={(open) => !open && handleClose()}>
      {appeal && target && status && (
        <DialogContent className="sm:max-w-lg p-0">
          <div className="border-b border-border p-4 pr-12">
            <DialogTitle className="flex items-center gap-2 font-semibold text-foreground">
              <Gavel className="h-4 w-4 text-primary" />
              Resolve appeal
            </DialogTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  status.bg,
                  status.text
                )}
              >
                {status.label}
              </span>
              <span className="text-xs text-muted-foreground">
                Filed {formatDate(appeal.createdAt)}
              </span>
            </div>
          </div>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Contested decision
              </p>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Type · </span>
                  <span className="font-medium text-foreground">{target.label}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Record · </span>
                  <span className="font-medium text-foreground">
                    {appeal.targetReference ?? appeal.targetLabel ?? `#${shortId(appeal.targetId)}`}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Subject · </span>
                  <span className="font-medium text-foreground">
                    {appeal.subjectName ?? shortId(appeal.subjectUserId)}
                  </span>
                  {appeal.subjectEmail && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({appeal.subjectEmail})
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Original decider · </span>
                  <span className="font-medium text-foreground">
                    {appeal.originalDeciderName ?? shortId(appeal.originalDeciderId)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Why they are appealing
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{appeal.reason}</p>
            </div>

            {actionError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">Decision</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Overturning reopens the original claim or verification for a fresh review. An appeal
                cannot be resolved by the officer who made the original decision.
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setDecision('UPHELD');
                    setActionError(null);
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                    decision === 'UPHELD'
                      ? 'border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200'
                      : 'border-border hover:border-red-300'
                  )}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="block font-medium">Uphold</span>
                    <span className="block text-[11px] text-muted-foreground">
                      The original decision stands
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecision('OVERTURNED');
                    setActionError(null);
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                    decision === 'OVERTURNED'
                      ? 'border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200'
                      : 'border-border hover:border-green-300'
                  )}
                >
                  <RotateCcw className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="block font-medium">Overturn</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Reopen it for re-review
                    </span>
                  </span>
                </button>
              </div>

              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                placeholder="Note for the record (optional)"
                className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={!decision || resolveMutation.isPending}
                  onClick={() => resolveMutation.mutate()}
                >
                  {resolveMutation.isPending ? 'Saving…' : 'Resolve appeal'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={resolveMutation.isPending}
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
