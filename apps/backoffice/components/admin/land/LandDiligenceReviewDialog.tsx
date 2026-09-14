'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  CircleAlert,
  FileLock2,
  HelpCircle,
  Link2,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DocumentPreviewButton,
  DialogTitle,
  Input,
  LegacyInput,
  Select,
  Textarea,
} from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type { EvidenceItem } from '@/types/admin';
import type {
  LandDiligenceChecklistItem,
  LandDiligenceChecklistStatus,
  LandDiligenceDecisionInput,
  LandDiligenceDocument,
  LandDiligenceDocumentLinkInput,
  LandDiligenceRecord,
} from '@/types/land';
import { EvidencePanel } from '@/components/shared/EvidencePanel';
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
  /**
   * Every document on the property, with whether the review already cites it.
   * Fetched by the page: the dialog stays presentational.
   */
  documents?: LandDiligenceDocument[];
  documentsLoading?: boolean;
  /** Withdraws or records reliance on a document (`verifications.review`). */
  canManageDocuments?: boolean;
  onLinkDocument?: (input: LandDiligenceDocumentLinkInput) => void;
  onUnlinkDocument?: (documentId: string) => void;
  linkingDocumentId?: string | null;
  unlinkingDocumentId?: string | null;
  /** Re-signs a document's URL once the original link has expired. */
  onResolveDocumentUrl?: (documentId: string) => Promise<string | null | undefined>;
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
 * Review the documents a diligence decision rests on, and the structured
 * checklist, before deciding.
 *
 * The files are the property's own documents opened through short-lived signed
 * links, so the reviewer works from the same paperwork the owner submitted
 * rather than a copy held somewhere else.
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
  documents = [],
  documentsLoading = false,
  canManageDocuments = false,
  onLinkDocument,
  onUnlinkDocument,
  linkingDocumentId = null,
  unlinkingDocumentId = null,
  onResolveDocumentUrl,
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
  /** Which uncited document is mid-citation, and what the reviewer is saying about it. */
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [pendingChecklistKey, setPendingChecklistKey] = useState('');
  const [pendingNote, setPendingNote] = useState('');

  const isSubmitting = isApproving || isRejecting || isRequestingClarification;
  const location = useMemo(
    () => [record?.city, record?.state].filter(Boolean).join(', '),
    [record?.city, record?.state]
  );

  const citedDocuments = useMemo(
    () => documents.filter((document) => document.link).map(toCitedEvidence),
    [documents]
  );
  const uncitedDocuments = useMemo(() => documents.filter((document) => !document.link), [documents]);
  /** The reviewer's own working checklist, offered when tying a document to a check. */
  const checklistOptions = checklist
    .filter((item) => item.key.trim())
    .map((item) => ({ value: item.key.trim(), label: item.label.trim() || item.key.trim() }));

  const closePendingCitation = () => {
    setPendingDocumentId(null);
    setPendingChecklistKey('');
    setPendingNote('');
  };

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
                        Documents on this property
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {record.ownershipProofCount} ownership proof
                        {record.ownershipProofCount === 1 ? '' : 's'} on file. A decision should
                        rest on these documents, opened through short-lived links.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Cited by this review
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Naming the document behind a check is what makes the verdict auditable
                        later.
                      </p>
                      {citedDocuments.length === 0 ? (
                        <p className="mt-2 rounded-xl bg-secondary/50 px-3 py-2.5 text-xs text-muted-foreground">
                          No document has been cited yet. A citation is what makes this verdict
                          auditable later.
                        </p>
                      ) : (
                        <EvidencePanel
                          evidence={citedDocuments}
                          heading="Documents"
                          canAttach={false}
                          className="mt-2"
                          onRemove={
                            canManageDocuments && onUnlinkDocument
                              ? (documentId) => onUnlinkDocument(documentId)
                              : undefined
                          }
                          removingId={unlinkingDocumentId}
                          removeTitle="Stop citing this document"
                          onResolveUrl={onResolveDocumentUrl}
                        />
                      )}
                    </div>

                    {uncitedDocuments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Other documents on this property
                        </p>
                        <ul className="mt-2 space-y-2">
                          {uncitedDocuments.map((document) => (
                            <li
                              key={document.id}
                              className="rounded-lg border border-border bg-card p-2.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {document.name}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {humanise(document.documentType)}
                                    {document.uploadedBy?.legalName &&
                                      ` · ${document.uploadedBy.legalName}`}
                                    {` · ${formatDate(document.uploadedAt)}`}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <DocumentPreview document={document} onResolveUrl={onResolveDocumentUrl} />
                                  {canManageDocuments && onLinkDocument && (
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      onClick={() =>
                                        setPendingDocumentId(
                                          pendingDocumentId === document.id ? null : document.id
                                        )
                                      }
                                      disabled={Boolean(linkingDocumentId)}
                                      icon={<Link2 className="h-3.5 w-3.5" />}
                                    >
                                      Cite
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {pendingDocumentId === document.id && onLinkDocument && (
                                <div className="mt-2.5 grid gap-2 rounded-lg bg-secondary/45 p-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                  <Select
                                    value={pendingChecklistKey}
                                    onValueChange={setPendingChecklistKey}
                                    ariaLabel="Check this document answers"
                                    options={[
                                      { value: '', label: 'Not tied to a check' },
                                      ...checklistOptions,
                                    ]}
                                  />
                                  <LegacyInput
                                    type="text"
                                    value={pendingNote}
                                    onChange={(event) => setPendingNote(event.target.value)}
                                    placeholder="Why this document (optional)"
                                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      onClick={closePendingCitation}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="xs"
                                      isLoading={linkingDocumentId === document.id}
                                      disabled={Boolean(linkingDocumentId)}
                                      onClick={() => {
                                        onLinkDocument({
                                          documentId: document.id,
                                          checklistKey: pendingChecklistKey || undefined,
                                          note: pendingNote.trim() || undefined,
                                        });
                                        closePendingCitation();
                                      }}
                                    >
                                      Cite document
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {documentsLoading && (
                      <p className="text-xs text-muted-foreground">Loading documents…</p>
                    )}
                    {!documentsLoading && documents.length === 0 && (
                      <p className="rounded-xl bg-secondary/50 px-3 py-2.5 text-xs text-muted-foreground">
                        This property has no documents yet. Ask the owner for the title, survey
                        plan, or ownership proof before deciding.
                      </p>
                    )}
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

/** `SURVEY_PLAN` reads as "Survey plan" wherever a document type is shown. */
const humanise = (value: string) =>
  value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (character) => character.toUpperCase());

/**
 * A cited document, as the shared evidence panel expects it.
 *
 * The panel carries the file's own provenance, so who cited it and against
 * which check is recorded in the note — that is what a later reviewer needs to
 * see, and it keeps one renderer for evidence across every case family.
 */
const toCitedEvidence = (document: LandDiligenceDocument): EvidenceItem => {
  const link = document.link;
  const citation = [
    link && `Cited by ${link.linkedByName} on ${formatDate(link.linkedAt)}`,
    link?.checklistKey ? `check: ${link.checklistKey}` : null,
    link?.note?.trim(),
  ]
    .filter(Boolean)
    .join(' · ');

  return { ...document, note: citation || undefined };
};

const DocumentPreview = ({
  document,
  onResolveUrl,
}: {
  document: LandDiligenceDocument;
  onResolveUrl?: (documentId: string) => Promise<string | null | undefined>;
}) => (
  <DocumentPreviewButton
    file={{ url: document.url, name: document.name, mimeType: document.mimeType ?? undefined }}
    label="Preview"
    resolveUrl={onResolveUrl ? () => onResolveUrl(document.id) : undefined}
  />
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
