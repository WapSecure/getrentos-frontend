'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, CircleAlert, HelpCircle, ShieldCheck, XCircle } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
  DatePicker,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import type { AdminLandDiligenceDetail } from '@/types/land';
import { gaveFirstApproval } from './LandApprovalBanner';
import {
  fromDateInput,
  toDateInput,
  tomorrowDateInput,
  useInvalidateLandCase,
  type LandCasePanelProps,
} from './shared';

type DecisionMode = 'approve' | 'reject' | 'clarify';

const OPEN_STATUSES = new Set(['IN_REVIEW', 'ACTION_REQUIRED']);

/**
 * Approve, request clarification or reject. Every decision carries the case
 * version the reviewer loaded, so a decision taken on a stale view is refused
 * (409) instead of silently overwriting someone else's.
 */
export const LandDecisionBar = ({
  detail,
  canReview,
  canApprove,
  currentUserName,
  stale,
  onError,
  onSuccess,
}: LandCasePanelProps & {
  detail: AdminLandDiligenceDetail;
  currentUserName?: string;
  stale: boolean;
}) => {
  const { propertyId, diligence } = detail;
  const invalidate = useInvalidateLandCase();
  const [mode, setMode] = useState<DecisionMode | null>(null);
  const [reason, setReason] = useState('');
  const [findings, setFindings] = useState(diligence.findings ?? '');
  const [expiresAt, setExpiresAt] = useState(toDateInput(diligence.expiresAt));
  const [minDate] = useState(tomorrowDateInput);

  const blockers = detail.approvalBlockers ?? [];
  const isOpen = OPEN_STATUSES.has(String(diligence.status));
  const awaitingSecond = Boolean(diligence.awaitingSecondApproval);
  const firstIsMine = gaveFirstApproval(detail, currentUserName);
  const isFirstOfTwo = Boolean(detail.requiresDualApproval) && !awaitingSecond;

  const decide = useMutation({
    mutationFn: (decision: DecisionMode) => {
      const expectedVersion = diligence.version;
      if (decision === 'approve') {
        return unwrap(
          adminLandService.approveDiligence(propertyId, {
            findings: findings.trim() || undefined,
            expiresAt: isFirstOfTwo ? undefined : fromDateInput(expiresAt),
            expectedVersion,
          })
        );
      }
      const input = { reason: reason.trim(), expectedVersion };
      return unwrap(
        decision === 'reject'
          ? adminLandService.rejectDiligence(propertyId, input)
          : adminLandService.requestClarification(propertyId, input)
      );
    },
    onSuccess: (_result, decision) => {
      invalidate();
      setMode(null);
      setReason('');
      onSuccess(
        decision === 'approve'
          ? isFirstOfTwo
            ? 'First approval recorded. A different reviewer must now give the second.'
            : 'Land diligence approved. The listing can proceed once every publishing rule is met.'
          : decision === 'reject'
            ? 'Land diligence rejected and the owner has been notified.'
            : 'Clarification requested from the owner.'
      );
    },
    onError: (error) => {
      setMode(null);
      onError(error, 'Unable to record that decision.', { versioned: true });
    },
  });

  if (!isOpen) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
        This case is {String(diligence.status).replaceAll('_', ' ').toLowerCase()}
        {diligence.reviewedByName && ` (decided by ${diligence.reviewedByName})`}. Decisions open
        again when the owner resubmits.
      </div>
    );
  }

  const approveDisabledReason = stale
    ? 'Reload the case first.'
    : blockers.length
      ? 'Resolve the approval blockers first.'
      : firstIsMine
        ? 'You gave the first approval; a different reviewer must give the second.'
        : null;
  const approveLabel = awaitingSecond
    ? 'Give second approval'
    : isFirstOfTwo
      ? 'Approve (first of two)'
      : 'Approve';
  const reasonValid = reason.trim().length >= 3;

  return (
    <>
      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          Case version {diligence.version ?? '—'}
          {approveDisabledReason && canApprove && (
            <span className="ml-2 text-warning">{approveDisabledReason}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {canReview && (
            <Button
              variant="ghost"
              onClick={() => setMode('clarify')}
              disabled={stale || decide.isPending}
              icon={<HelpCircle className="h-4 w-4" />}
            >
              Request clarification
            </Button>
          )}
          {canApprove && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setMode('reject')}
              disabled={stale || decide.isPending}
              icon={<XCircle className="h-4 w-4" />}
            >
              Reject
            </Button>
          )}
          {canApprove && (
            <Button
              variant="primary"
              onClick={() => setMode('approve')}
              disabled={Boolean(approveDisabledReason) || decide.isPending}
              title={approveDisabledReason ?? undefined}
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              {approveLabel}
            </Button>
          )}
        </div>
      </div>

      <Dialog
        open={mode !== null}
        onOpenChange={(open) => !open && !decide.isPending && setMode(null)}
      >
        {mode && (
          <DialogContent className="max-w-lg">
            <div className="space-y-4 p-5">
              <div>
                <DialogTitle className="type-heading text-lg">
                  {mode === 'approve'
                    ? approveLabel
                    : mode === 'reject'
                      ? 'Reject diligence'
                      : 'Request clarification'}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {mode === 'approve'
                    ? isFirstOfTwo
                      ? 'Your approval is recorded as the first of two. The case is verified only when a different reviewer gives the second.'
                      : 'Confirm the parcel has passed diligence. Verification lasts until the expiry (one year by default).'
                    : mode === 'reject'
                      ? 'Rejection ends this review. The owner receives the reason and must resubmit to start again.'
                      : 'Tell the owner exactly what evidence or detail is needed. The case returns to them.'}
                </DialogDescription>
              </div>

              {mode === 'approve' ? (
                <>
                  <Field label="Findings" hint="Visible to the owner, never public.">
                    <Textarea
                      value={findings}
                      maxLength={10000}
                      onChange={(event) => setFindings(event.target.value)}
                      placeholder="Summarise the title, survey, registry and encumbrance checks."
                    />
                  </Field>
                  {!isFirstOfTwo && (
                    <Field label="Verification expiry" hint="Optional; defaults to one year.">
                      <DatePicker
                        value={expiresAt}
                        onChange={(next) => setExpiresAt(next)}
                        min={minDate}
                      />
                    </Field>
                  )}
                </>
              ) : (
                <Field
                  label={mode === 'reject' ? 'Reason for rejection' : 'What the owner must provide'}
                  hint="Shared with the owner. At least 3 characters."
                  required
                >
                  <Textarea
                    value={reason}
                    maxLength={10000}
                    autoFocus
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={
                      mode === 'reject'
                        ? 'e.g. The title chain could not be reconciled with the registry search.'
                        : 'e.g. Upload a current survey plan signed by a registered surveyor.'
                    }
                  />
                </Field>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => setMode(null)} disabled={decide.isPending}>
                  Cancel
                </Button>
                <Button
                  variant={mode === 'reject' ? 'danger' : 'primary'}
                  onClick={() => decide.mutate(mode)}
                  disabled={(mode !== 'approve' && !reasonValid) || decide.isPending}
                  isLoading={decide.isPending}
                  icon={
                    mode === 'approve' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <CircleAlert className="h-4 w-4" />
                    )
                  }
                >
                  {mode === 'approve'
                    ? approveLabel
                    : mode === 'reject'
                      ? 'Reject case'
                      : 'Send request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};
