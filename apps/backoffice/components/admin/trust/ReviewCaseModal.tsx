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
import { Button, Select, Textarea } from '@getrentos/ui';
import { cn, formatDate, unwrap } from '@getrentos/shared';
import { trustService } from '@/services/trustService';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import type { TrustReviewCaseSummary, TrustReviewDecision } from '@/types/trust';
import {
  REVIEW_CASE_PRIORITY_META,
  REVIEW_CASE_STATUS_META,
  TRUST_STEP_STATUS_META,
} from './trustMeta';

const RESOLVE_OPTIONS: { value: TrustReviewDecision | ''; label: string }[] = [
  { value: '', label: 'Select a decision…' },
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

  const { data: detail, isLoading: detailLoading } = useQuery({
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
        <DialogContent className="sm:max-w-2xl">
          <div className="p-4 border-b border-border pr-12">
            <DialogTitle className="flex items-center gap-2 font-semibold text-foreground">
              <Fingerprint className="h-4 w-4 text-primary" />
              Trust review case
            </DialogTitle>
            {detail && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    REVIEW_CASE_STATUS_META[detail.status].bg,
                    REVIEW_CASE_STATUS_META[detail.status].text
                  )}
                >
                  {REVIEW_CASE_STATUS_META[detail.status].label}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    REVIEW_CASE_PRIORITY_META[detail.priority].bg,
                    REVIEW_CASE_PRIORITY_META[detail.priority].text
                  )}
                >
                  {REVIEW_CASE_PRIORITY_META[detail.priority].label} priority
                </span>
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
              <div className="flex justify-center py-14">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
                        const meta = TRUST_STEP_STATUS_META[step.status] ?? {
                          label: step.status,
                          text: 'text-muted-foreground',
                          bg: 'bg-secondary',
                        };
                        return (
                          <div
                            key={step.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {STEP_TYPE_LABEL[step.stepType] ?? step.stepType}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {step.provider ? `${step.provider} · ` : ''}
                                {step.attempts} attempt{step.attempts === 1 ? '' : 's'}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                meta.bg,
                                meta.text
                              )}
                            >
                              {meta.label}
                            </span>
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
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
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
                        options={[
                          {
                            value: '',
                            label: detail.assigneeId ? 'Reassign reviewer…' : 'Assign a reviewer…',
                          },
                          ...officers.map((o) => ({
                            value: o.id,
                            label: `${o.legalName} (${o.email ?? 'no email'})`,
                          })),
                        ]}
                        className="w-full"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!assigneeId || busy}
                        onClick={() => assignMutation.mutate(assigneeId)}
                      >
                        {assignMutation.isPending ? 'Assigning…' : 'Assign'}
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
                        className="w-full"
                      />
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="Note for the case record (optional)"
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {isBlocking && (
                        <p className="flex items-start gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          Four-eyes: blocking decisions are confirmed by a second officer — the
                          reviewer assigned to this case cannot be the resolver.
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          disabled={!decision || busy}
                          onClick={() => resolveMutation.mutate()}
                        >
                          {resolveMutation.isPending
                            ? 'Resolving…'
                            : isBlocking
                              ? 'Confirm blocking decision'
                              : 'Approve (pass)'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => escalateMutation.mutate()}
                        >
                          {escalateMutation.isPending ? 'Escalating…' : 'Escalate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isResolved && (
                  <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4" />
                    This case is {detail.status.toLowerCase()}. It can no longer be changed.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Could not load case detail.
              </div>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
