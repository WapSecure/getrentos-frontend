'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Gavel, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  Alert,
  Badge,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  RadioGroup,
  Textarea,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
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
              <Badge variant={status.variant}>{status.label}</Badge>
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
              <div className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div className="min-w-0 break-words">
                  <span className="text-muted-foreground">Type · </span>
                  <span className="font-medium text-foreground">{target.label}</span>
                </div>
                <div className="min-w-0 break-words">
                  <span className="text-muted-foreground">Record · </span>
                  <span className="font-medium text-foreground">
                    {appeal.targetReference ?? appeal.targetLabel ?? `#${shortId(appeal.targetId)}`}
                  </span>
                </div>
                <div className="min-w-0 break-words">
                  <span className="text-muted-foreground">Subject · </span>
                  <span className="font-medium text-foreground">
                    {appeal.subjectName ?? shortId(appeal.subjectUserId)}
                  </span>
                  {appeal.subjectEmail && (
                    <span className="mt-0.5 block break-all text-xs text-muted-foreground">
                      {appeal.subjectEmail}
                    </span>
                  )}
                </div>
                <div className="min-w-0 break-words">
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
              <Alert variant="danger" icon={ShieldAlert}>
                {actionError}
              </Alert>
            )}

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">Decision</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Overturning reopens the original claim or verification for a fresh review. An appeal
                cannot be resolved by the officer who made the original decision.
              </p>

              <RadioGroup
                value={decision}
                onValueChange={(value) => {
                  setDecision(value);
                  setActionError(null);
                }}
                variant="card"
                columns={2}
                aria-label="Decision"
                className="mt-3"
                options={[
                  {
                    value: 'UPHELD' as TrustAppealDecision,
                    label: 'Uphold',
                    description: 'The original decision stands',
                    icon: <ShieldCheck className="h-4 w-4" />,
                  },
                  {
                    value: 'OVERTURNED' as TrustAppealDecision,
                    label: 'Overturn',
                    description: 'Reopen it for re-review',
                    icon: <RotateCcw className="h-4 w-4" />,
                  },
                ]}
              />

              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                placeholder="Note for the record (optional)"
                aria-label="Resolution note"
                className="mt-3"
              />

              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={!decision || resolveMutation.isPending}
                  isLoading={resolveMutation.isPending}
                  loadingText="Saving…"
                  onClick={() => resolveMutation.mutate()}
                >
                  Resolve appeal
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
