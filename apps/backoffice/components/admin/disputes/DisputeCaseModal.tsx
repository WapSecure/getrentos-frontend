'use client';

import {
  LegacyInput,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Select,
  DocumentPreviewButton,
} from '@getrentos/ui';

import { useRef, useState } from 'react';
import {
  CheckCircle2,
  ArrowUpCircle,
  Search,
  RotateCcw,
  Send,
  ExternalLink,
  Paperclip,
  FileText,
  ImageIcon,
  Upload,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@getrentos/shared';
import type {
  Dispute,
  DisputeDetail,
  DisputeEvidence,
  DisputeMessage,
  DisputeResolveOutcome,
} from '@/types/admin';

const STATUS_PILL: Record<Dispute['status'], string> = {
  open: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  escalated: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const ESCROW_LABEL: Record<string, string> = {
  DEPOSIT_PENDING: 'Deposit pending',
  FUNDS_HELD: 'Funds held',
  VERIFICATION_PENDING: 'Verification pending',
  SETTLEMENT_PENDING: 'Settlement pending',
  RELEASED: 'Released',
  REFUNDED: 'Refunded',
  FROZEN: 'Frozen',
  DISPUTED: 'Disputed',
};

interface DisputeCaseModalProps {
  dispute: Dispute | null;
  detail?: DisputeDetail;
  detailLoading?: boolean;
  messages: DisputeMessage[];
  onClose: () => void;
  onStartReview: (id: string) => void;
  onReopen: (id: string) => void;
  onEscalate: (id: string) => void;
  onResolve: (id: string, resolution: string | undefined, outcome: DisputeResolveOutcome) => void;
  onSendMessage: (id: string, text: string) => void;
  /** Uploads the file as this case's evidence. Gated by `canAttachEvidence`. */
  onAttachEvidence?: (id: string, file: File, note?: string) => void;
  /**
   * Re-signs a stored file's URL. Signed links are short-lived by design, so a
   * viewer left open past the expiry asks for a fresh one instead of showing a
   * broken file.
   */
  onResolveEvidenceUrl?: (evidenceId: string) => Promise<string | null | undefined>;
  canAttachEvidence?: boolean;
  isResolving?: boolean;
  isEscalating?: boolean;
  isReviewing?: boolean;
  isReopening?: boolean;
  isSendingMessage?: boolean;
  isAttachingEvidence?: boolean;
}

/**
 * Mirrors the backend's evidence allow-list and size cap so a reviewer gets an
 * immediate answer instead of a round trip that ends in a 400.
 */
const EVIDENCE_ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/heic,image/avif,application/pdf,video/mp4,video/quicktime,video/webm,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const EVIDENCE_MAX_BYTES = 25 * 1024 * 1024;

const formatBytes = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

const isImageEvidence = (evidence: DisputeEvidence) =>
  Boolean(evidence.mimeType?.startsWith('image/')) ||
  /\.(png|jpe?g|webp|gif|heic|avif)$/i.test(evidence.name);

export const DisputeCaseModal = ({
  dispute,
  detail,
  detailLoading = false,
  messages,
  onClose,
  onStartReview,
  onReopen,
  onEscalate,
  onResolve,
  onSendMessage,
  onAttachEvidence,
  onResolveEvidenceUrl,
  canAttachEvidence = false,
  isResolving = false,
  isEscalating = false,
  isReviewing = false,
  isReopening = false,
  isSendingMessage = false,
  isAttachingEvidence = false,
}: DisputeCaseModalProps) => {
  const [messageText, setMessageText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [outcome, setOutcome] = useState<DisputeResolveOutcome>('none');
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  if (!dispute) return null;

  const tx = detail?.transaction;
  const escrowFrozen = tx?.escrowStatus === 'FROZEN' || tx?.escrowStatus === 'DISPUTED';
  const canDecide = dispute.status !== 'resolved';
  const canStartReview = dispute.status === 'open';
  const canReopen = dispute.status === 'resolved' || dispute.status === 'escalated';
  const evidence = detail?.evidence ?? [];

  const resetAttachForm = () => {
    setShowAttachForm(false);
    setEvidenceFile(null);
    setEvidenceNote('');
    setEvidenceError(null);
    if (evidenceInputRef.current) evidenceInputRef.current.value = '';
  };

  /** Same checks the endpoint makes, so the reviewer finds out before uploading. */
  const handlePickEvidence = (file: File | undefined) => {
    if (!file) return;
    if (file.size > EVIDENCE_MAX_BYTES) {
      setEvidenceError('Files must be 25 MB or smaller.');
      setEvidenceFile(null);
      return;
    }
    if (file.type && !EVIDENCE_ACCEPT.split(',').includes(file.type)) {
      setEvidenceError('Attach an image, PDF, video, or office document.');
      setEvidenceFile(null);
      return;
    }
    setEvidenceError(null);
    setEvidenceFile(file);
  };

  const handleAttachEvidence = () => {
    if (!evidenceFile || !onAttachEvidence) return;
    onAttachEvidence(dispute.id, evidenceFile, evidenceNote.trim() || undefined);
    resetAttachForm();
  };

  const outcomeOptions: { value: DisputeResolveOutcome; label: string }[] = escrowFrozen
    ? [
        { value: 'none', label: 'No money move (unfreeze to held)' },
        { value: 'release', label: 'Release funds to seller' },
        { value: 'refund', label: 'Refund funds to buyer' },
      ]
    : [{ value: 'none', label: 'No money move (escrow not frozen)' }];

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(dispute.id, messageText);
    setMessageText('');
  };

  const handleResolve = () => {
    onResolve(dispute.id, resolutionText.trim() || undefined, outcome);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-border shrink-0 pr-12">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="font-semibold text-foreground truncate">
                {dispute.title}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {dispute.raisedBy} vs. {dispute.against}
                {dispute.amount !== undefined
                  ? ` · ${formatCurrency(dispute.amount, { compact: true })}`
                  : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                  STATUS_PILL[dispute.status]
                )}
              >
                {dispute.status.replace('_', ' ')}
              </span>
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
                {dispute.category.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-secondary/50 border-b border-border">
            <p className="text-sm text-muted-foreground">{dispute.description}</p>
            {detailLoading ? (
              <p className="text-xs text-muted-foreground mt-2">Loading case context…</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs">
                {detail?.raisedBy && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Raised by:</span>{' '}
                    {detail.raisedBy.legalName}
                    {detail.raisedBy.email ? ` · ${detail.raisedBy.email}` : ''}
                  </p>
                )}
                {detail?.against && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Against:</span>{' '}
                    {detail.against.legalName}
                    {detail.against.email ? ` · ${detail.against.email}` : ''}
                  </p>
                )}
                {detail?.resolvedBy && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Resolved by:</span>{' '}
                    {detail.resolvedBy.legalName}
                  </p>
                )}
                {evidence.length > 0 && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Evidence:</span>{' '}
                    {evidence.length} item{evidence.length === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            )}
          </div>

          {(evidence.length > 0 || canAttachEvidence) && (
            <div className="px-4 py-3 border-b border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Evidence ({evidence.length})
                </p>
                {canAttachEvidence && !showAttachForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setShowAttachForm(true)}
                    disabled={!onAttachEvidence}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach evidence
                  </Button>
                )}
              </div>

              {showAttachForm && canAttachEvidence && (
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 space-y-2">
                  <input
                    ref={evidenceInputRef}
                    type="file"
                    accept={EVIDENCE_ACCEPT}
                    className="sr-only"
                    id={`dispute-evidence-input-${dispute.id}`}
                    onChange={(e) => handlePickEvidence(e.target.files?.[0])}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => evidenceInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {evidenceFile ? 'Choose another file' : 'Choose file'}
                    </Button>
                    {evidenceFile && (
                      <span className="text-xs text-foreground truncate max-w-full">
                        {evidenceFile.name}
                        <span className="text-muted-foreground">
                          {' '}
                          · {formatBytes(evidenceFile.size)}
                        </span>
                      </span>
                    )}
                  </div>
                  <LegacyInput
                    type="text"
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    placeholder="Why you are adding this (optional, shown on the case)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {evidenceError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{evidenceError}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Stored on our side and opened through a short-lived link, so access can be
                    revoked. Images, PDFs, video and office documents up to 25 MB.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleAttachEvidence}
                      disabled={!evidenceFile || isAttachingEvidence}
                      isLoading={isAttachingEvidence}
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Attach to case
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetAttachForm}
                      disabled={isAttachingEvidence}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {evidence.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No files attached to this case yet. Links submitted by a party arrive as
                  unverified external references; files attached here are held on our side.
                </p>
              )}

              <ul className="space-y-2">
                {evidence.map((item) => {
                  const isStored = item.kind === 'STORED';
                  const meta = [
                    item.uploadedBy?.legalName,
                    isStored ? formatBytes(item.sizeBytes) : null,
                    isStored ? null : item.host,
                    formatDate(item.uploadedAt),
                  ].filter(Boolean);

                  return (
                    <li
                      key={item.id}
                      className={cn(
                        'rounded-lg border p-2.5 flex items-start gap-2.5',
                        isStored
                          ? 'border-border bg-card'
                          : 'border-amber-300/60 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-900/10'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 shrink-0',
                          isStored ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {isImageEvidence(item) ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground break-all">
                            {item.name}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-medium',
                              item.source === 'ADMIN'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-accent text-muted-foreground'
                            )}
                          >
                            {item.source === 'ADMIN' ? 'Added by staff' : 'Submitted by a party'}
                          </span>
                        </div>
                        {meta.length > 0 && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground break-all">
                            {meta.join(' · ')}
                          </p>
                        )}
                        {!isStored && (
                          <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                            External link recorded before uploads were supported — we did not
                            receive this file.
                          </p>
                        )}
                        {item.note && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            &ldquo;{item.note}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isStored ? (
                          <DocumentPreviewButton
                            file={{
                              url: item.url,
                              name: item.name,
                              mimeType: item.mimeType ?? undefined,
                            }}
                            label="Preview"
                            resolveUrl={
                              onResolveEvidenceUrl
                                ? () => onResolveEvidenceUrl(item.id)
                                : undefined
                            }
                          />
                        ) : (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100/70 dark:text-amber-300 dark:hover:bg-amber-900/30"
                          >
                            Open
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {detail?.resolution && (
            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-border text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                Resolution
                {detail.resolvedAt ? ` · ${new Date(detail.resolvedAt).toLocaleString()}` : ''}
              </p>
              <p className="text-muted-foreground mt-0.5">{detail.resolution}</p>
            </div>
          )}

          {tx && (
            <div className="px-4 py-3 border-b border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Escrow transaction
                </p>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {ESCROW_LABEL[tx.escrowStatus] ?? tx.escrowStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {tx.property && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Property:</span>{' '}
                    {tx.property.title}
                  </p>
                )}
                {tx.offer && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Offer:</span> {tx.offer.status}
                  </p>
                )}
                {tx.buyer && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Buyer:</span> {tx.buyer.legalName}
                  </p>
                )}
                {tx.seller && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Seller:</span>{' '}
                    {tx.seller.legalName}
                  </p>
                )}
                {tx.amount !== undefined && (
                  <p className="truncate">
                    <span className="font-medium text-foreground">Amount:</span>{' '}
                    {formatCurrency(tx.amount, { compact: true })}
                  </p>
                )}
                {tx.frozenReason && (
                  <p className="col-span-2 truncate">
                    <span className="font-medium text-foreground">Frozen:</span> {tx.frozenReason}
                  </p>
                )}
              </div>
              {tx.events && tx.events.length > 0 && (
                <div className="border-t border-border/60 pt-2 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Timeline
                  </p>
                  {tx.events.map((event) => (
                    <div
                      key={event.createdAt + event.eventType}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                      <span className="text-foreground font-medium">{event.eventType}</span>
                      <span className="text-muted-foreground">{event.status}</span>
                      <span className="text-muted-foreground/70 ml-auto">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No messages yet in this dispute thread
              </p>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.senderId === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl p-3',
                        isAdmin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      <p className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                        {msg.senderName}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border shrink-0 space-y-3">
          {canDecide && (
            <div className="space-y-2 rounded-lg bg-secondary/40 p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Select
                    value={outcome}
                    onValueChange={(value) => setOutcome(value as DisputeResolveOutcome)}
                    options={outcomeOptions}
                    className="w-full"
                  />
                </div>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Resolution note shown to both parties (optional)"
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleResolve}
                  isLoading={isResolving}
                  disabled={isResolving || isEscalating || isReviewing || isReopening}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolve
                  {outcome === 'release' ? ' & release' : outcome === 'refund' ? ' & refund' : ''}
                </Button>
                {canStartReview && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onStartReview(dispute.id)}
                    isLoading={isReviewing}
                    disabled={isResolving || isEscalating || isReviewing}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Start review
                  </Button>
                )}
                {canReopen && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onReopen(dispute.id)}
                    isLoading={isReopening}
                    disabled={isResolving || isReopening}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reopen
                  </Button>
                )}
                {canDecide && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onEscalate(dispute.id)}
                    isLoading={isEscalating}
                    disabled={isResolving || isEscalating}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    Escalate
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <LegacyInput
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Send a message to both parties..."
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              variant="secondary"
              onClick={handleSend}
              disabled={!messageText.trim() || isSendingMessage}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
