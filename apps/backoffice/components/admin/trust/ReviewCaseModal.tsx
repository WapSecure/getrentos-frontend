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
} from '@sureground/icons';
import { Dialog, DialogContent, DialogTitle } from '@sureground/ui';
import {
  Alert,
  Badge,
  Button,
  CardSkeleton,
  CheckboxGroup,
  EmptyState,
  PageErrorState,
  Select,
  Textarea,
  type BadgeVariant,
} from '@sureground/ui';
import { formatDate, SOURCE_OF_FUNDS_SUPPORTING_LABELS, unwrap } from '@sureground/shared';
import { trustService } from '@/services/trustService';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import type {
  ForeignCaseDocument,
  ForeignPurpose,
  TrustEvidenceItem,
  TrustReviewCaseSummary,
  TrustReviewDecision,
} from '@/types/trust';
import type { EvidenceItem } from '@/types/admin';
import { EvidencePanel } from '@/components/shared/EvidencePanel';
import {
  FOREIGN_PURPOSE_LABEL,
  isForeignPurpose,
  REVIEW_CASE_PRIORITY_META,
  REVIEW_CASE_STATUS_META,
  TRUST_STEP_STATUS_META,
} from './trustMeta';
import { REVIEW_CASE_PRIORITY_VARIANT, REVIEW_CASE_STATUS_VARIANT } from './ReviewCaseCard';
import { DIMENSION_LABELS, nonScoreCodes, parseScoreCodes } from './scoreCodes';

const ScoreAtDecisionCodes = ({ reasonCodes }: { reasonCodes: string[] }) => {
  const score = parseScoreCodes(reasonCodes);
  if (!score) return null;

  return (
    <div className="mt-2 rounded-lg bg-secondary/50 px-3 py-2">
      <p className="text-2xs font-medium text-foreground">
        Trust score at decision: {score.total ?? '—'}
        {score.version ? ` (${score.version})` : ''}
        {score.penalty ? ` · penalty −${score.penalty}` : ''}
      </p>
      {score.dimensions.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {score.dimensions.map((dimension) => (
            <li key={dimension.id} className="flex items-center gap-2">
              <span className="w-32 shrink-0 text-2xs text-muted-foreground">
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
              <span className="w-14 shrink-0 text-right text-2xs tabular-nums text-muted-foreground">
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
  PASSPORT_CHECK: 'Passport check',
  FOREIGN_ADDRESS_CHECK: 'Proof of address abroad',
  FOREIGN_BANK_STATEMENT_CHECK: 'Bank statement from abroad',
  SOURCE_OF_FUNDS_CHECK: 'Source of funds',
};

// ---- Diaspora identity and source-of-funds cases: uploads through GET :id/documents, decision through POST :id/decision.

const FOREIGN_DOCUMENT_LABEL: Record<ForeignPurpose, string> = {
  FOREIGN_IDENTITY: 'Passport photo page',
  FOREIGN_ADDRESS: 'Proof of address',
  FOREIGN_BANK_STATEMENT: 'Bank statement',
  SOURCE_OF_FUNDS: 'Source of funds document',
};

/** Source-of-funds uploads say which document each file is. */
const SOURCE_OF_FUNDS_DOCUMENT_LABEL: Record<string, string> = {
  ...SOURCE_OF_FUNDS_SUPPORTING_LABELS,
  BANK_STATEMENTS: 'Bank statement',
  DONOR_IDENTITY: 'Donor’s identity document',
};

const foreignItemLabel = (item: ForeignCaseDocument, purpose: ForeignPurpose) => {
  const document = item.summary?.document;
  if (typeof document === 'string' && SOURCE_OF_FUNDS_DOCUMENT_LABEL[document]) {
    return SOURCE_OF_FUNDS_DOCUMENT_LABEL[document];
  }
  if (item.category === 'SELFIE') return 'Selfie';
  if (item.category === 'ADDRESS') return 'Proof of address';
  if (item.category === 'BIOMETRIC') return 'Liveness and face match';
  return FOREIGN_DOCUMENT_LABEL[purpose];
};

const humanKey = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

/** Smile ID results carry no file (Smile keeps the images): show what we kept. */
const SMILE_SUMMARY_SKIP = new Set([
  'source',
  'product',
  'sandbox',
  'mimeType',
  'sizeBytes',
  'document',
]);

const summaryRows = (summary: Record<string, unknown> | null): [string, string][] =>
  Object.entries(summary ?? {}).flatMap(([key, value]): [string, string][] => {
    if (SMILE_SUMMARY_SKIP.has(key) || value === null || value === undefined) return [];
    if (Array.isArray(value)) return value.length > 0 ? [[key, value.join(', ')]] : [];
    return typeof value === 'object' ? [] : [[key, String(value)]];
  });

const toEvidence = (item: ForeignCaseDocument, purpose: ForeignPurpose): EvidenceItem => ({
  id: item.id,
  kind: 'STORED',
  name: foreignItemLabel(item, purpose),
  mimeType: typeof item.summary?.mimeType === 'string' ? item.summary.mimeType : null,
  url: item.url ?? '',
  sizeBytes: typeof item.summary?.sizeBytes === 'number' ? item.summary.sizeBytes : null,
  source: 'PARTY',
  note: typeof item.summary?.note === 'string' ? item.summary.note : null,
  uploadedAt: item.capturedAt,
  urlExpiresInSeconds: item.urlExpiresInSeconds,
});

const hasSandboxFlag = (value: unknown) =>
  Boolean(value && typeof value === 'object' && (value as { sandbox?: unknown }).sandbox === true);

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

// Must match the API's minimum.
const MIN_BLOCKING_NOTE_LENGTH = 15;

const describeCode = (code: string, checklist: TrustEvidenceItem[]) => {
  const [kind, item] = code.split(':');
  if (!item || (kind !== 'EVIDENCE_CONFIRMED' && kind !== 'EVIDENCE_FAILED')) return code;
  const label = checklist.find((entry) => entry.code === item)?.label ?? item;
  return `${kind === 'EVIDENCE_CONFIRMED' ? 'Confirmed' : 'Did not pass'}: ${label}`;
};

// Every final decision, pass included, needs a second officer to confirm it.
const FOUR_EYES_HINT =
  'Four-eyes: decisions are confirmed by a second officer: the reviewer assigned to this case cannot be the resolver.';

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
  const [ticked, setTicked] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  // Opening uploads is audited, so it is a deliberate click rather than on load.
  const [showDocuments, setShowDocuments] = useState(false);

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
    queryFn: () => unwrap(adminService.listStaffDirectory({ page: 1, pageSize: 100 })),
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

  const purpose = detail?.verification.purpose ?? caseItem?.verification?.purpose;
  const foreign = isForeignPurpose(purpose) ? purpose : null;

  const resolveMutation = useMutation({
    mutationFn: () => {
      const input = {
        decision: decision as TrustReviewDecision,
        note: note.trim() || undefined,
        ...(decision === 'PASS' ? { confirmedEvidence: ticked } : { failedEvidence: ticked }),
      };
      return unwrap(
        foreign
          ? trustService.decideForeignCase(id!, input)
          : trustService.resolveReviewCase(id!, input)
      );
    },
    onSuccess: () => {
      setActionError(null);
      setNote('');
      setTicked([]);
      invalidateAll();
    },
    onError: (reason) =>
      setActionError(reason instanceof Error ? reason.message : 'Unable to resolve case.'),
  });

  const isBlocking = decision === 'REJECT' || decision === 'RESTRICT';
  const checklist = detail?.verification.evidenceChecklist ?? [];
  // Approving needs every item confirmed; blocking needs a failed item or a written reason.
  const evidenceReady =
    decision === 'PASS'
      ? checklist.every((item) => ticked.includes(item.code))
      : ticked.length > 0 || note.trim().length >= MIN_BLOCKING_NOTE_LENGTH;
  // The API refuses these outright; don't offer a decision the officer can't make.
  const myId = useAdminUser()?.id;
  const assignedToMe = Boolean(myId && detail?.assigneeId === myId);
  const aboutMe = Boolean(
    myId && detail?.verification.subjectType === 'PERSON' && detail.verification.subjectId === myId
  );
  const unassigned = Boolean(detail && !detail.assigneeId);
  const canDecide = !assignedToMe && !aboutMe && !unassigned;
  const isResolved = detail?.status === 'RESOLVED' || detail?.status === 'CLOSED';

  const documents = useQuery({
    queryKey: adminKeys.foreignCaseDocuments(id ?? ''),
    queryFn: () => unwrap(trustService.getForeignCaseDocuments(id!)),
    enabled: Boolean(id && foreign && showDocuments && !aboutMe),
    // Links last 15 minutes; Preview asks again for a fresh one.
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const documentItems = documents.data?.items ?? [];
  const files = foreign
    ? documentItems.filter((item) => item.url).map((item) => toEvidence(item, foreign))
    : [];
  const providerResults = documentItems.filter(
    (item) => !item.url && item.source !== 'user_upload'
  );
  const removedFiles = documentItems.filter((item) => !item.url && item.source === 'user_upload');
  const freshUrl = async (evidenceId: string) => {
    const next = await documents.refetch();
    return next.data?.items.find((item) => item.id === evidenceId)?.url ?? null;
  };
  const dueAt = documents.data?.dueAt ?? detail?.dueAt ?? caseItem?.dueAt ?? null;
  // Staff only: the automatic check ran against Smile ID's sandbox.
  const testMode =
    Boolean(foreign) &&
    (documentItems.some((item) => hasSandboxFlag(item.summary)) ||
      Boolean(detail?.verification.steps.some((step) => hasSandboxFlag(step.result))));
  const busy = assignMutation.isPending || escalateMutation.isPending || resolveMutation.isPending;

  const handleClose = () => {
    if (busy) return;
    setActionError(null);
    setNote('');
    setDecision('');
    setTicked([]);
    setShowDocuments(false);
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
                {foreign && dueAt && (
                  <span className="text-xs text-muted-foreground">
                    Due {formatDate(dueAt)} (2 working days)
                  </span>
                )}
                {testMode && (
                  <Badge variant="neutral" title="Smile ID sandbox: not a real passport check">
                    Test mode
                  </Badge>
                )}
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
                <div className="rounded-xl border border-border p-4">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                        {foreign ? FOREIGN_PURPOSE_LABEL[foreign] : detail.verification.purpose}
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

                {foreign && (
                  <div className="rounded-xl border border-border p-4">
                    {aboutMe ? (
                      <p className="text-sm text-muted-foreground">
                        These uploads are about your own account, so another officer opens them.
                      </p>
                    ) : !showDocuments ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                          {foreign === 'SOURCE_OF_FUNDS'
                            ? 'The person’s bank statements and supporting documents.'
                            : 'The person’s uploads and the Smile ID result.'}{' '}
                          Opening them is logged, and the links last 15 minutes.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="h-4 w-4" />}
                          onClick={() => setShowDocuments(true)}
                        >
                          Open uploads
                        </Button>
                      </div>
                    ) : documents.isLoading ? (
                      <CardSkeleton lines={3} />
                    ) : documents.isError ? (
                      <Alert variant="danger" icon={ShieldAlert}>
                        {documents.error instanceof Error
                          ? documents.error.message
                          : 'Could not load the uploads.'}
                      </Alert>
                    ) : (
                      <div className="space-y-3">
                        <EvidencePanel
                          evidence={files}
                          heading="Uploads"
                          emptyHint="No files on this case."
                          onResolveUrl={freshUrl}
                        />
                        {removedFiles.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {removedFiles.length} file
                            {removedFiles.length === 1 ? ' was' : 's were'} removed under our
                            retention policy.
                          </p>
                        )}
                        {providerResults.map((item) => (
                          <div key={item.id} className="rounded-lg border border-border px-3 py-2">
                            <p className="text-sm font-medium text-foreground">
                              {foreignItemLabel(item, foreign)}
                              <span className="ml-1.5 text-2xs font-normal text-muted-foreground">
                                Smile ID result · {formatDate(item.capturedAt)}
                              </span>
                            </p>
                            <dl className="mt-1 grid gap-x-3 gap-y-0.5 text-2xs sm:grid-cols-2">
                              {summaryRows(item.summary).map(([key, value]) => (
                                <div key={key} className="flex gap-1">
                                  <dt className="text-muted-foreground">{humanKey(key)}:</dt>
                                  <dd className="break-all font-mono text-foreground">{value}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        ))}
                        {testMode && (
                          <p className="text-2xs text-muted-foreground">
                            Test mode: the automatic check ran against Smile ID&apos;s sandbox,
                            which decides by test names, not by the real passport.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                                <p className="text-2xs text-muted-foreground">
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
                              <pre className="mt-1.5 max-h-24 overflow-auto rounded-md bg-muted/60 px-2 py-1 font-mono text-2xs leading-snug text-muted-foreground">
                                {resultText}
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verification decisions
                  </p>
                  {detail.verification.decisions.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="No decisions recorded yet"
                      description="Each decision taken on this verification will appear here."
                      size="compact"
                      bare
                    />
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
                                <p className="mt-1 text-2xs text-muted-foreground">
                                  {nonScoreCodes(d.reasonCodes)
                                    .map((code) => describeCode(code, checklist))
                                    .join(' · ')}
                                </p>
                              )}
                              <ScoreAtDecisionCodes reasonCodes={d.reasonCodes} />
                              <p className="text-2xs text-muted-foreground">
                                {formatDate(d.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <History className="h-3.5 w-3.5" /> Case activity
                  </p>
                  <div className="mt-3 space-y-2">
                    {detail.actions.length === 0 ? (
                      <EmptyState
                        icon={History}
                        title="No activity yet"
                        description="Every action staff take on this case will be logged here."
                        size="compact"
                        bare
                      />
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
                            <p className="text-2xs text-muted-foreground">
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

                {!isResolved && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Eye className="h-4 w-4 text-primary" /> Decision & handling
                    </p>

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

                    <div className="mt-4 space-y-2">
                      {aboutMe ? (
                        <Alert variant="warning" icon={ShieldAlert}>
                          This case is about your own account, so another officer resolves it.
                        </Alert>
                      ) : assignedToMe ? (
                        <Alert variant="warning" icon={ShieldAlert}>
                          {FOUR_EYES_HINT} You are the assigned reviewer, so another officer
                          confirms the decision.
                        </Alert>
                      ) : unassigned ? (
                        <Alert variant="info" icon={ShieldAlert}>
                          Assign a reviewer first. {FOUR_EYES_HINT}
                        </Alert>
                      ) : null}
                      {canDecide && (
                        <Select
                          value={decision}
                          onValueChange={(value) => {
                            setDecision(value as TrustReviewDecision | '');
                            setTicked([]);
                            setActionError(null);
                          }}
                          options={RESOLVE_OPTIONS}
                          placeholder="Select a decision…"
                          ariaLabel="Decision"
                          searchable={false}
                          className="w-full"
                        />
                      )}
                      {canDecide && decision && checklist.length > 0 && (
                        <div className="rounded-lg border border-border p-3">
                          <CheckboxGroup
                            legend={
                              decision === 'PASS'
                                ? 'Confirm each item before approving'
                                : 'Tick what did not pass'
                            }
                            value={ticked}
                            onValueChange={setTicked}
                            options={checklist.map((item) => ({
                              value: item.code,
                              label: item.label,
                            }))}
                          />
                        </div>
                      )}
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder={
                          isBlocking
                            ? 'Why it did not pass (needed if you tick nothing above)'
                            : 'Note for the case record (optional)'
                        }
                        aria-label="Case note"
                      />
                      {canDecide && decision && (
                        <Alert variant="warning" icon={ShieldAlert}>
                          {FOUR_EYES_HINT}
                        </Alert>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {canDecide && (
                          <Button
                            size="sm"
                            disabled={!decision || !evidenceReady || busy}
                            isLoading={resolveMutation.isPending}
                            loadingText="Resolving…"
                            onClick={() => resolveMutation.mutate()}
                          >
                            {isBlocking ? 'Confirm blocking decision' : 'Approve (pass)'}
                          </Button>
                        )}
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
