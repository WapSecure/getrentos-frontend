'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  CircleAlert,
  FileLock2,
  HelpCircle,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Button, Dialog, DialogContent, DialogTitle, Input, Select, Textarea } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type {
  LandDiligenceChecklistItem,
  LandDiligenceChecklistStatus,
  LandDiligenceDecisionInput,
  LandDiligenceRecord,
} from '@/types/land';
import { LandDiligenceStatusBadge } from './LandDiligenceStatusBadge';

type ReviewMode = 'view' | 'approve' | 'reject' | 'clarify';

interface LandDiligenceReviewDialogProps {
  record: LandDiligenceRecord | null;
  onClose: () => void;
  onApprove: (
    propertyId: string,
    data: Pick<LandDiligenceDecisionInput, 'findings' | 'checklist' | 'expiresAt'>
  ) => void;
  onReject: (
    propertyId: string,
    data: Pick<LandDiligenceDecisionInput, 'reason' | 'checklist'>
  ) => void;
  onRequestClarification: (
    propertyId: string,
    data: Pick<LandDiligenceDecisionInput, 'reason' | 'checklist'>
  ) => void;
  canApprove: boolean;
  isApproving?: boolean;
  isRejecting?: boolean;
  isRequestingClarification?: boolean;
}

const checklistStatuses: { value: LandDiligenceChecklistStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FLAGGED', label: 'Flagged' },
  { value: 'NOT_APPLICABLE', label: 'Not applicable' },
];

const toDateInputValue = (value: string | null | undefined) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

const createChecklistItem = (): LandDiligenceChecklistItem => ({
  key: `review-check-${Date.now()}`,
  label: '',
  status: 'PENDING',
});

/**
 * Review evidence metadata and a structured checklist without ever rendering
 * the document source. Secure evidence access remains in the Documents area.
 */
export const LandDiligenceReviewDialog = ({
  record,
  onClose,
  onApprove,
  onReject,
  onRequestClarification,
  canApprove,
  isApproving = false,
  isRejecting = false,
  isRequestingClarification = false,
}: LandDiligenceReviewDialogProps) => {
  // The dialog is keyed by record.propertyId in the page, so it remounts on
  // record change and these initializers always reflect the active record.
  const [mode, setMode] = useState<ReviewMode>('view');
  const [reason, setReason] = useState('');
  const [findings, setFindings] = useState(record?.diligence.findings ?? '');
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(record?.diligence.expiresAt));
  const [checklist, setChecklist] = useState<LandDiligenceChecklistItem[]>(
    record?.diligence.checklist ?? []
  );

  const isSubmitting = isApproving || isRejecting || isRequestingClarification;
  const location = useMemo(
    () => [record?.city, record?.state].filter(Boolean).join(', '),
    [record?.city, record?.state]
  );

  const cleanChecklist = () =>
    checklist
      .map((item) => ({
        ...item,
        key: item.key.trim(),
        label: item.label.trim(),
        note: item.note?.trim() || undefined,
      }))
      .filter((item) => item.key && item.label);

  const updateChecklist = (index: number, patch: Partial<LandDiligenceChecklistItem>) =>
    setChecklist((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const submit = () => {
    if (!record) return;
    const safeChecklist = cleanChecklist();
    if (mode === 'approve') {
      onApprove(record.propertyId, {
        findings: findings.trim() || undefined,
        checklist: safeChecklist.length ? safeChecklist : undefined,
        expiresAt: expiresAt || undefined,
      });
    }
    if (mode === 'reject') {
      onReject(record.propertyId, {
        reason: reason.trim(),
        checklist: safeChecklist.length ? safeChecklist : undefined,
      });
    }
    if (mode === 'clarify') {
      onRequestClarification(record.propertyId, {
        reason: reason.trim(),
        checklist: safeChecklist.length ? safeChecklist : undefined,
      });
    }
  };

  const actionTitle =
    mode === 'approve'
      ? 'Approve diligence'
      : mode === 'reject'
        ? 'Reject diligence'
        : 'Request clarification';
  const canSubmit = mode === 'approve' || (mode !== 'view' && reason.trim().length >= 3);

  return (
    <Dialog open={Boolean(record)} onOpenChange={(open) => !open && handleClose()}>
      {record && (
        <DialogContent className="max-w-3xl">
          <div className="border-b border-border px-5 py-4 pr-12">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="type-heading text-lg">{record.propertyTitle}</DialogTitle>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5" />
                    {record.ownerName}
                  </span>
                  {location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {location}
                    </span>
                  )}
                </div>
              </div>
              <LandDiligenceStatusBadge status={record.diligence.status} />
            </div>
          </div>

          <div className="space-y-5 p-5">
            {mode === 'view' ? (
              <>
                <section className="grid gap-3 rounded-2xl border border-border bg-secondary/30 p-4 sm:grid-cols-2">
                  <Metadata
                    label="Plot"
                    value={
                      record.parcel.plotNumber ? `Plot ${record.parcel.plotNumber}` : 'Not supplied'
                    }
                  />
                  <Metadata
                    label="Estate / layout"
                    value={record.parcel.estateName ?? 'Not supplied'}
                  />
                  <Metadata
                    label="Area"
                    value={`${record.parcel.areaValue.toLocaleString()} ${record.parcel.areaUnit}`}
                  />
                  <Metadata
                    label="Title"
                    value={record.parcel.titleType?.replaceAll('_', ' ') ?? 'Not supplied'}
                  />
                  <Metadata
                    label="Survey number"
                    value={record.parcel.surveyNumber ?? 'Not supplied'}
                  />
                  <Metadata label="Submitted" value={formatDate(record.createdAt)} />
                </section>

                <section className="rounded-2xl border border-border p-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                      <FileLock2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Evidence is kept private
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {record.ownershipProofCount} ownership proof
                        {record.ownershipProofCount === 1 ? '' : 's'} on file. This queue only
                        displays verified metadata; use the secured Documents workspace for
                        authorised evidence access.
                      </p>
                    </div>
                  </div>
                </section>

                {record.diligence.findings && (
                  <section className="rounded-2xl border border-border p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Reviewer findings
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                      {record.diligence.findings}
                    </p>
                  </section>
                )}

                {(record.diligence.reviewedAt || record.diligence.expiresAt) && (
                  <p className="text-xs text-muted-foreground">
                    {record.diligence.reviewedAt &&
                      `Last reviewed ${formatDate(record.diligence.reviewedAt)}`}
                    {record.diligence.reviewedAt && record.diligence.expiresAt && ' · '}
                    {record.diligence.expiresAt &&
                      `Expires ${formatDate(record.diligence.expiresAt)}`}
                    {record.diligence.reviewedByName && ` · ${record.diligence.reviewedByName}`}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-primary/20 bg-accent/40 px-3.5 py-3 text-sm text-foreground">
                  {mode === 'approve'
                    ? 'Confirm that the land record has passed its diligence checks. An optional expiry keeps verification current.'
                    : mode === 'reject'
                      ? 'Explain what prevents this land record from proceeding. The owner will receive the reason.'
                      : 'Specify the evidence or detail the owner needs to provide before this review can continue.'}
                </div>

                {mode === 'approve' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Internal findings{' '}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <Textarea
                        value={findings}
                        onChange={(event) => setFindings(event.target.value)}
                        placeholder="Summarise title, survey, registry, or encumbrance checks."
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Verification expiry{' '}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <Input
                        type="date"
                        value={expiresAt}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(event) => setExpiresAt(event.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      {mode === 'reject' ? 'Reason for rejection' : 'Clarification required'}
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder={
                        mode === 'reject'
                          ? 'For example: title chain could not be reconciled with the submitted survey.'
                          : 'For example: upload a current survey plan signed by a registered surveyor.'
                      }
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                )}

                <ChecklistEditor
                  items={checklist}
                  disabled={isSubmitting}
                  onAdd={() => setChecklist((items) => [...items, createChecklistItem()])}
                  onRemove={(index) =>
                    setChecklist((items) => items.filter((_, itemIndex) => itemIndex !== index))
                  }
                  onChange={updateChecklist}
                />
              </>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
            {mode === 'view' ? (
              <>
                <Button
                  variant="ghost"
                  className="sm:mr-auto"
                  onClick={() => setMode('clarify')}
                  disabled={isSubmitting}
                  icon={<HelpCircle className="h-4 w-4" />}
                >
                  Need info
                </Button>
                {canApprove && (
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setMode('reject')}
                    disabled={isSubmitting}
                    icon={<XCircle className="h-4 w-4" />}
                  >
                    Reject
                  </Button>
                )}
                {canApprove && (
                  <Button
                    variant="primary"
                    onClick={() => setMode('approve')}
                    disabled={isSubmitting}
                    icon={<ShieldCheck className="h-4 w-4" />}
                  >
                    Approve
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setMode('view')} disabled={isSubmitting}>
                  Back
                </Button>
                <Button
                  variant={mode === 'reject' ? 'danger' : 'primary'}
                  onClick={submit}
                  disabled={!canSubmit || isSubmitting}
                  isLoading={isSubmitting}
                  icon={
                    mode === 'approve' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <CircleAlert className="h-4 w-4" />
                    )
                  }
                >
                  {actionTitle}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

const Metadata = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-sm text-foreground">{value}</p>
  </div>
);

interface ChecklistEditorProps {
  items: LandDiligenceChecklistItem[];
  disabled: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, patch: Partial<LandDiligenceChecklistItem>) => void;
}

const ChecklistEditor = ({ items, disabled, onAdd, onRemove, onChange }: ChecklistEditorProps) => (
  <section className="rounded-2xl border border-border p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-sm font-medium text-foreground">Diligence checklist</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Record checks and outcomes only. Evidence files stay in secure storage.
        </p>
      </div>
      <Button
        variant="ghost"
        size="xs"
        onClick={onAdd}
        disabled={disabled}
        icon={<Plus className="h-3.5 w-3.5" />}
      >
        Add check
      </Button>
    </div>

    {items.length === 0 ? (
      <p className="mt-3 rounded-xl bg-secondary/50 px-3 py-2.5 text-xs text-muted-foreground">
        No structured checks have been recorded yet.
      </p>
    ) : (
      <div className="mt-3 space-y-2.5">
        {items.map((item, index) => (
          <div
            key={`${item.key}-${index}`}
            className="grid gap-2 rounded-xl bg-secondary/45 p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
          >
            <div className="space-y-2">
              <Input
                aria-label={`Checklist item ${index + 1}`}
                value={item.label}
                onChange={(event) => onChange(index, { label: event.target.value })}
                placeholder="Check name, e.g. Survey plan"
                disabled={disabled}
              />
              <Input
                aria-label={`Checklist note ${index + 1}`}
                value={item.note ?? ''}
                onChange={(event) => onChange(index, { note: event.target.value })}
                placeholder="Reviewer note (optional)"
                disabled={disabled}
              />
            </div>
            <Select
              value={item.status}
              onValueChange={(value) =>
                onChange(index, { status: value as LandDiligenceChecklistStatus })
              }
              options={checklistStatuses}
              ariaLabel={`Checklist status ${index + 1}`}
              disabled={disabled}
            />
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-destructive"
              onClick={() => onRemove(index)}
              disabled={disabled}
              title="Remove checklist item"
              icon={<Trash2 className="h-4 w-4" />}
            >
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        ))}
      </div>
    )}
  </section>
);
