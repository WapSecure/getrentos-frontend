'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Check,
  CircleAlert,
  HelpCircle,
  PauseCircle,
  PlayCircle,
  Plus,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  IconButton,
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
  // Approving with conditions makes the case CONDITIONAL: listed, not yet open to reservations or offers.
  const [conditions, setConditions] = useState<{ text: string; dueAt: string }[]>([]);
  const [pause, setPause] = useState<'suspend' | 'resume' | null>(null);
  const [pauseNote, setPauseNote] = useState('');

  const blockers = detail.approvalBlockers ?? [];
  const isOpen = OPEN_STATUSES.has(String(diligence.status));
  const awaitingSecond = Boolean(diligence.awaitingSecondApproval);
  const firstIsMine = gaveFirstApproval(detail, currentUserName);
  const isFirstOfTwo = Boolean(detail.requiresDualApproval) && !awaitingSecond;

  const filledConditions = conditions.filter((condition) => condition.text.trim() !== '');
  const conditionsValid = filledConditions.every((condition) => condition.text.trim().length >= 10);

  const pauseMutation = useMutation({
    mutationFn: (action: 'suspend' | 'resume') =>
      unwrap(
        action === 'suspend'
          ? adminLandService.suspendDiligence(propertyId, {
              reason: pauseNote,
              expectedVersion: diligence.version,
            })
          : adminLandService.resumeDiligence(propertyId, {
              note: pauseNote,
              expectedVersion: diligence.version,
            })
      ),
    onSuccess: (_result, action) => {
      invalidate();
      onSuccess(
        action === 'suspend'
          ? 'Suspended. The land is off the market and the owner has been told.'
          : 'Resumed. The owner has been told.'
      );
    },
    onError: (error) => onError(error, 'Unable to change the suspension.', { versioned: true }),
  });

  const decide = useMutation({
    mutationFn: (decision: DecisionMode) => {
      const expectedVersion = diligence.version;
      if (decision === 'approve') {
        return unwrap(
          adminLandService.approveDiligence(propertyId, {
            findings: findings.trim() || undefined,
            expiresAt: isFirstOfTwo ? undefined : fromDateInput(expiresAt),
            expectedVersion,
            ...(!isFirstOfTwo && filledConditions.length
              ? {
                  conditions: filledConditions.map((condition) => ({
                    text: condition.text.trim(),
                    ...(condition.dueAt ? { dueAt: fromDateInput(condition.dueAt) } : {}),
                  })),
                }
              : {}),
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
      setConditions([]);
      onSuccess(
        decision === 'approve'
          ? isFirstOfTwo
            ? 'First approval recorded. A different reviewer must now give the second.'
            : filledConditions.length
              ? 'Approved with conditions. The land can be listed; reservations and offers open once every condition is settled.'
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
    const status = String(diligence.status);
    const canSuspend = canApprove && (status === 'VERIFIED' || status === 'CONDITIONAL');
    const canResume = canApprove && status === 'SUSPENDED';
    return (
      <>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {status === 'SUSPENDED' ? (
              <>
                Suspended{diligence.suspension?.bySystem ? ' automatically' : ''}
                {diligence.suspension?.reason ? `: ${diligence.suspension.reason}` : '.'} Resume it
                once nothing blocks the land.
              </>
            ) : (
              <>
                This case is {status.replaceAll('_', ' ').toLowerCase()}
                {diligence.reviewedByName && ` (decided by ${diligence.reviewedByName})`}. Decisions
                open again when the owner resubmits.
              </>
            )}
          </p>
          {(canSuspend || canResume) && (
            <Button
              variant={canResume ? 'primary' : 'outline'}
              className={canResume ? undefined : 'text-destructive'}
              disabled={stale || pauseMutation.isPending}
              icon={
                canResume ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />
              }
              onClick={() => setPause(canResume ? 'resume' : 'suspend')}
            >
              {canResume ? 'Resume' : 'Suspend'}
            </Button>
          )}
        </div>
        <ConfirmDialog
          open={pause !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPause(null);
              setPauseNote('');
            }
          }}
          title={pause === 'resume' ? 'Resume this land' : 'Suspend this land'}
          description={
            pause === 'resume'
              ? 'It goes back to what it was before (or expired, if its review lapsed meanwhile). Refused while a dispute hold, encumbrance or conflict remains.'
              : 'It comes off the market at once: no listing, reservations or offers until it is resumed. The owner sees your reason.'
          }
          confirmLabel={pause === 'resume' ? 'Resume' : 'Suspend'}
          tone={pause === 'resume' ? 'primary' : 'danger'}
          promptLabel={pause === 'resume' ? 'What was resolved' : 'Reason'}
          promptValue={pauseNote}
          onPromptChange={setPauseNote}
          promptRequired
          promptMinLength={pause === 'resume' ? 5 : 10}
          isLoading={pauseMutation.isPending}
          onConfirm={() => (pause ? pauseMutation.mutateAsync(pause) : undefined)}
        />
      </>
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
                  {!isFirstOfTwo && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Conditions</p>
                        <p className="text-xs text-muted-foreground">
                          Optional. With conditions the land is listed and buyers see them, but
                          reservations and offers wait until each is met or waived.
                        </p>
                      </div>
                      {conditions.map((condition, index) => (
                        <div key={index} className="space-y-2 rounded-xl border border-border p-3">
                          <div className="flex items-start gap-2">
                            <Field
                              label={`Condition ${index + 1}`}
                              className="flex-1"
                              error={
                                condition.text.trim() && condition.text.trim().length < 10
                                  ? 'At least 10 characters.'
                                  : undefined
                              }
                            >
                              <Textarea
                                rows={2}
                                maxLength={500}
                                value={condition.text}
                                placeholder="e.g. Governor's consent to the 2019 assignment is registered"
                                onChange={(event) =>
                                  setConditions((current) =>
                                    current.map((row, i) =>
                                      i === index ? { ...row, text: event.target.value } : row
                                    )
                                  )
                                }
                              />
                            </Field>
                            <IconButton
                              label="Remove condition"
                              icon={<Trash2 className="h-4 w-4" />}
                              className="mt-6"
                              onClick={() =>
                                setConditions((current) => current.filter((_, i) => i !== index))
                              }
                            />
                          </div>
                          <Field label="Expected by" hint="Optional.">
                            <DatePicker
                              value={condition.dueAt}
                              min={minDate}
                              clearable
                              onChange={(next) =>
                                setConditions((current) =>
                                  current.map((row, i) =>
                                    i === index ? { ...row, dueAt: next } : row
                                  )
                                )
                              }
                            />
                          </Field>
                        </div>
                      ))}
                      {conditions.length < 10 && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Plus className="h-4 w-4" />}
                          onClick={() =>
                            setConditions((current) => [...current, { text: '', dueAt: '' }])
                          }
                        >
                          Add a condition
                        </Button>
                      )}
                    </div>
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
                  disabled={
                    (mode !== 'approve' && !reasonValid) ||
                    (mode === 'approve' && !conditionsValid) ||
                    decide.isPending
                  }
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
