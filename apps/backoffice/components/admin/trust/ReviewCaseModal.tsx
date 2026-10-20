'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Eye,
  Fingerprint,
  History,
  Layers,
  ShieldAlert,
  UserRoundCheck,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import {
  Alert,
  Badge,
  Button,
  CardSkeleton,
  PageErrorState,
  Select,
  Textarea,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { trustService } from '@/services/trustService';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import type { TrustReviewCaseSummary, TrustReviewDecision } from '@/types/trust';
import {
  REVIEW_CASE_PRIORITY_META,
  REVIEW_CASE_STATUS_META,
  TRUST_STEP_STATUS_META,
} from './trustMeta';
import { REVIEW_CASE_PRIORITY_VARIANT, REVIEW_CASE_STATUS_VARIANT } from './ReviewCaseCard';
import { DIMENSION_LABELS, nonScoreCodes, parseScoreCodes } from './scoreCodes';

/**
 * The dimension.v1 score as it stood when this decision was taken, decoded from
 * the decision payload's own codes. A reviewer who can see that a rejection
 * happened at score 50: with the financial dimension at 25/25: reads the case
 * very differently from one who sees only the verdict.
 */
const ScoreAtDecisionCodes = ({ reasonCodes }: { reasonCodes: string[] }) => {
  const score = parseScoreCodes(reasonCodes);
  if (!score) return null;

  return (
    <div className="mt-2 rounded-lg bg-secondary/50 px-3 py-2">
      <p className="text-[11px] font-medium text-foreground">
        Trust score at decision: {score.total ?? '—'}
        {score.version ? ` (${score.version})` : ''}
        {score.penalty ? ` · penalty −${score.penalty}` : ''}
      </p>
      {score.dimensions.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {score.dimensions.map((dimension) => (
            <li key={dimension.id} className="flex items-center gap-2">
              <span className="w-32 shrink-0 text-[11px] text-muted-foreground">
                {DIMENSION_LABELS[dimension.id] ?? dimension.id}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{
                    width: `${dimension.weight > 0 ? Math.round((dimension.earned / dimension.weight) * 100) : 0}%`,
                  }}
                />
              </span>
              <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {dimension.earned}/{dimension.weight}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const RESOLVE_OPTIONS: { value: TrustReviewDecision; label: string }[] = [
  { value: 'PASS', label: 'Pass (approve verification)' },
  { value: 'REJECT', label: 'Reject (blocking)' },
  { value: 'RESTRICT', label: 'Restrict (blocking)' },
];

const STEP_TYPE_LABEL: Record<string, string> = {
  PHONE_OTP: 'Phone OTP',
  EMAIL_OTP: 'Email OTP',
  NIN_CHECK: 'NIN check',
  BVN_CHECK: 'BVN check',
  SELFIE_CAPTURE: 'Selfie capture',
  LIVENESS_CHECK: 'Liveness check',
  FACE_MATCH: 'Face match',
  DOCUMENT_CHECK: 'Document check',
  AML_CHECK: 'AML check',
  DEVICE_RISK: 'Device risk',
  PROPERTY_ADDRESS_CHECK: 'Property address',
  PROPERTY_DOCUMENT_CHECK: 'Property document',
  OWNERSHIP_CHECK: 'Ownership check',
  BANK_ACCOUNT_CHECK: 'Bank account',
};

const DECISION_META: Record<string, { label: string; variant: BadgeVariant }> = {
  PASS: { label: 'Pass', variant: 'success' },
  REVIEW: { label: 'Review', variant: 'warning' },
  REJECT: { label: 'Reject', variant: 'danger' },
  RESTRICT: { label: 'Restrict', variant: 'warning' },
};

const STEP_VARIANT: Record<string, BadgeVariant> = {
  PASSED: 'success',
  FAILED: 'danger',
  REVIEW_REQUIRED: 'warning',
  IN_PROGRESS: 'info',
  WAITING_FOR_USER: 'info',
  WAITING_FOR_PROVIDER: 'info',
};

const shortId = (id?: string | null) => (id ? `${id.slice(0, 8)}…` : '—');

interface ReviewCaseModalProps {
  caseItem: TrustReviewCaseSummary | null;
  onClose: () => void;
}

export const ReviewCaseModal = ({ caseItem, onClose }: ReviewCaseModalProps) => {
  const queryClient = useQueryClient();
  const [assigneeId, setAssigneeId] = useState('');
  const [decision, setDecision] = useState<TrustReviewDecision | ''>('');
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const id = caseItem?.id;

  const {
    data: detail,
    isLoading: detailLoading,
    isFetching: detailFetching,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: adminKeys.reviewCaseDetail(id ?? ''),
    queryFn: () => (id ? unwrap(trustService.getReviewCaseDetail(id)) : null),
    enabled: Boolean(id),
  });

  const { data: staffData } = useQuery({
    queryKey: ['admin', 'trust', 'staff-options'],
    queryFn: () => unwrap(adminService.listStaff({ page: 1, pageSize: 100 })),
    enabled: Boolean(id),
  });
  const officers = staffData?.items ?? [];

  const officerName = detail?.assigneeId
    ? (officers.find((o) => o.id === detail.assigneeId)?.legalName ?? shortId(detail.assigneeId))
    : null;

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'trust', 'review-cases'] });

  const assignMutation = useMutation({
    mutationFn: (targetId: string) => unwrap(trustService.assignReviewCase(id!, targetId)),
    onSuccess: () => {
      setActionError(null);
      invalidateAll();
    },
    onError: (reason) =>
      setActionError(reason instanceof Error ? reason.message : 'Unable to assign reviewer.'),
  });

  const escalateMutation = useMutation({
    mutationFn: () => unwrap(trustService.escalateReviewCase(id!, note.trim() || undefined)),
    onSuccess: () => {
      setActionError(null);
      setNote('');
      invalidateAll();
    },
    onError: (reason) =>
      setActionError(reason instanceof Error ? reason.message : 'Unable to escalate case.'),
  });

  const resolveMutation = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.resolveReviewCase(id!, {
          decision: decision as TrustReviewDecision,
          note: note.trim() || undefined,
        })
      ),
    onSuccess: () => {
      setActionError(null);
      setNote('');
      invalidateAll();
    },
    onError: (reason) =>
      setActionError(reason instanceof Error ? reason.message : 'Unable to resolve case.'),
  });

  const isBlocking = decision === 'REJECT' || decision === 'RESTRICT';
  const isResolved = detail?.status === 'RESOLVED' || detail?.status === 'CLOSED';
  const busy = assignMutation.isPending || escalateMutation.isPending || resolveMutation.isPending;

  const handleClose = () => {
    if (busy) return;
    setActionError(null);
    setNote('');
    setDecision('');
    onClose();
  };

  return (
    <Dialog open={Boolean(caseItem)} onOpenChange={(open) => !open && handleClose()}>
      {caseItem && (
        <DialogContent className="sm:max-w-2xl p-0">
          <div className="p-4 border-b border-border pr-12">
            <DialogTitle className="flex items-center gap-2 font-semibold text-foreground">
              <Fingerprint className="h-4 w-4 text-primary" />
              Trust review case
            </DialogTitle>
            {detail && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={REVIEW_CASE_STATUS_VARIANT[detail.status]}>
                  {REVIEW_CASE_STATUS_META[detail.status].label}
                </Badge>
                <Badge variant={REVIEW_CASE_PRIORITY_VARIANT[detail.priority]}>
                  {REVIEW_CASE_PRIORITY_META[detail.priority].label} priority
                </Badge>
                {officerName && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <UserRoundCheck className="h-3.5 w-3.5" />
                    Assigned: {officerName}
                  </span>
                )}
                {detail.resolvedAt && (
                  <span className="text-xs text-muted-foreground">
                    Resolved {formatDate(detail.resolvedAt)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-0">
            {detailLoading ? (
              <div className="space-y-4 p-4">
                <CardSkeleton lines={4} />
                <CardSkeleton lines={3} />
              </div>
            ) : detail ? (
              <div className="space-y-5 p-4">
                {/* Subject */}
                <div className="rounded-xl border border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Subject
                  </p>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type · </span>
                      <span className="font-medium text-foreground">
                        {detail.verification.subjectType}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Id · </span>
                      <span className="font-mono text-xs text-foreground">
                        {detail.verification.subjectId}
                      </span>
                    </div>
                    {detail.subject?.legalName && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Name · </span>
                        <span className="font-medium text-foreground">
                          {detail.subject.legalName}
                        </span>
                        {detail.subject.email && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {detail.subject.email}
                          </span>
                        )}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Purpose · </span>
                      <span className="font-medium text-foreground">
                        {detail.verification.purpose}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Decision · </span>
                      <span className="font-semibold text-foreground">
                        {detail.verification.decision}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step timeline */}
                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" /> Step timeline
                  </p>
                  {detail.verification.steps.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No steps recorded.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {detail.verification.steps.map((step) => {
                        const label = TRUST_STEP_STATUS_META[step.status]?.label ?? step.status;
                        let resultText: string | null = null;
                        if (step.result && typeof step.result === 'object') {
                          try {
                            resultText = JSON.stringify(step.result);
                          } catch {
                            resultText = null;
                          }
                        }
                        return (
                          <div key={step.id} className="rounded-lg border border-border px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {STEP_TYPE_LABEL[step.stepType] ?? step.stepType}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {step.provider ? `${step.provider} · ` : ''}
                                  {step.attempts} attempt{step.attempts === 1 ? '' : 's'}
                                </p>
                              </div>
                              <Badge
                                variant={STEP_VARIANT[step.status] ?? 'neutral'}
                                className="shrink-0"
                              >
                                {label}
                              </Badge>
                            </div>
                            {resultText && (
                              <pre className="mt-1.5 max-h-24 overflow-auto rounded-md bg-muted/60 px-2 py-1 font-mono text-[10px] leading-snug text-muted-foreground">
                                {resultText}
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Decision history */}
                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verification decisions
                  </p>
                  {detail.verification.decisions.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No decisions recorded yet.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {detail.verification.decisions.map((d) => {
                        const m = DECISION_META[d.decision] ?? DECISION_META.REVIEW;
                        return (
                          <div
                            key={d.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                                <Badge variant={m.variant}>{m.label}</Badge>
                                {d.decidedBy && (
                                  <span className="text-xs font-normal text-muted-foreground">
                                    by {shortId(d.decidedBy)}
                                  </span>
                                )}
                              </p>
                              {d.reasonCodes.length > 0 && (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {nonScoreCodes(d.reasonCodes).join(', ')}
                                </p>
                              )}
                              <ScoreAtDecisionCodes reasonCodes={d.reasonCodes} />
                              <p className="text-[11px] text-muted-foreground">
                                {formatDate(d.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* History */}
                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <History className="h-3.5 w-3.5" /> Case activity
                  </p>
                  <div className="mt-3 space-y-2">
                    {detail.actions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No activity yet.</p>
                    ) : (
                      detail.actions.map((action) => (
                        <div key={action.id} className="flex items-start gap-2 text-sm">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <div className="min-w-0">
                            <p className="text-foreground">
                              <span className="font-semibold capitalize">{action.action}</span>
                              <span className="text-muted-foreground">
                                {' '}
                                {action.toStatus && `→ ${action.toStatus}`} · by{' '}
                                {shortId(action.actorId)}
                              </span>
                            </p>
                            {action.note && (
                              <p className="text-xs text-muted-foreground">{action.note}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                              {formatDate(action.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {actionError && (
                  <Alert variant="danger" icon={ShieldAlert}>
                    {actionError}
                  </Alert>
                )}

                {/* Actions */}
                {!isResolved && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Eye className="h-4 w-4 text-primary" /> Decision & handling
                    </p>

                    {/* Assign */}
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                      <Select
                        value={assigneeId}
                        onValueChange={(value) => {
                          setAssigneeId(value);
                          setActionError(null);
                        }}
                        placeholder={
                          detail.assigneeId ? 'Reassign reviewer…' : 'Assign a reviewer…'
                        }
                        ariaLabel="Reviewer"
                        options={officers.map((o) => ({
                          value: o.id,
                          label: `${o.legalName} (${o.email ?? 'no email'})`,
                        }))}
                        className="w-full"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!assigneeId || busy}
                        isLoading={assignMutation.isPending}
                        loadingText="Assigning…"
                        onClick={() => assignMutation.mutate(assigneeId)}
                      >
                        Assign
                      </Button>
                    </div>

                    {/* Resolve */}
                    <div className="mt-4 space-y-2">
                      <Select
                        value={decision}
                        onValueChange={(value) => {
                          setDecision(value as TrustReviewDecision | '');
                          setActionError(null);
                        }}
                        options={RESOLVE_OPTIONS}
                        placeholder="Select a decision…"
                        ariaLabel="Decision"
                        searchable={false}
                        className="w-full"
                      />
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Note for the case record (optional)"
                        aria-label="Case note"
                      />
                      {isBlocking && (
                        <Alert variant="warning" icon={ShieldAlert}>
                          Four-eyes: blocking decisions are confirmed by a second officer: the
                          reviewer assigned to this case cannot be the resolver.
                        </Alert>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          disabled={!decision || busy}
                          isLoading={resolveMutation.isPending}
                          loadingText="Resolving…"
                          onClick={() => resolveMutation.mutate()}
                        >
                          {isBlocking ? 'Confirm blocking decision' : 'Approve (pass)'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          isLoading={escalateMutation.isPending}
                          loadingText="Escalating…"
                          onClick={() => escalateMutation.mutate()}
                        >
                          Escalate
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isResolved && (
                  <Alert variant="success" icon={CheckCircle2}>
                    This case is {detail.status.toLowerCase()}. It can no longer be changed.
                  </Alert>
                )}
              </div>
            ) : (
              <PageErrorState
                title="Could not load case detail"
                onRetry={() => void refetchDetail()}
                isRetrying={detailFetching}
                headingLevel="h2"
                className="min-h-0 py-10"
              />
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
