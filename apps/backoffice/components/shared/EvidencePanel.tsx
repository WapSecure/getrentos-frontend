'use client';

import { useRef, useState } from 'react';
import { ExternalLink, FileText, ImageIcon, Paperclip, Upload } from 'lucide-react';
import { Button, DocumentPreviewButton, LegacyInput } from '@getrentos/ui';
import { cn, formatDate } from '@getrentos/shared';
import type { EvidenceItem } from '@/types/admin';

/**
 * Mirrors the backend's evidence allow-list and size cap so a reviewer gets an
 * immediate answer instead of a round trip that ends in a 400. Kept in step
 * with `src/shared/evidence/evidence.constants.ts`.
 */
export const EVIDENCE_ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/heic,image/avif,application/pdf,video/mp4,video/quicktime,video/webm,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const EVIDENCE_MAX_BYTES = 25 * 1024 * 1024;

const formatBytes = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

const isImageEvidence = (evidence: EvidenceItem) =>
  Boolean(evidence.mimeType?.startsWith('image/')) ||
  /\.(png|jpe?g|webp|gif|heic|avif)$/i.test(evidence.name);

interface EvidencePanelProps {
  evidence: EvidenceItem[];
  /** Enables the attach affordance. Omit both to render the list read-only. */
  onAttach?: (file: File, note?: string) => void;
  canAttach?: boolean;
  isAttaching?: boolean;
  /**
   * Re-signs a stored file's URL. Signed links are short-lived by design, so a
   * viewer left open past the expiry asks for a fresh one rather than showing a
   * broken file.
   */
  onResolveUrl?: (evidenceId: string) => Promise<string | null | undefined>;
  /** Shown when the case has no files yet. */
  emptyHint?: string;
  className?: string;
}

/**
 * The evidence on a case, as a reviewer needs to see it.
 *
 * Shared by every case family that can carry attachments, so a dispute, a fraud
 * alert and a vendor invoice all present evidence — and the warning that an
 * external link is not ours — the same way.
 *
 * Files we hold open in the in-app viewer through a short-lived signed URL.
 * Links recorded before uploads existed are separated out, labelled as not held
 * by us, and show their host, because a reviewer should be able to see where a
 * link goes before opening it.
 */
export const EvidencePanel = ({
  evidence,
  onAttach,
  canAttach = false,
  isAttaching = false,
  onResolveUrl,
  emptyHint = 'No files attached yet.',
  className,
}: EvidencePanelProps) => {
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setShowAttachForm(false);
    setFile(null);
    setNote('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  /** Same checks the endpoint makes, so the reviewer finds out before uploading. */
  const pick = (next: File | undefined) => {
    if (!next) return;
    if (next.size > EVIDENCE_MAX_BYTES) {
      setError(`Files must be ${EVIDENCE_MAX_BYTES / (1024 * 1024)} MB or smaller.`);
      setFile(null);
      return;
    }
    if (next.type && !EVIDENCE_ACCEPT.split(',').includes(next.type)) {
      setError('Attach an image, PDF, video, or office document.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(next);
  };

  const attach = () => {
    if (!file || !onAttach) return;
    onAttach(file, note.trim() || undefined);
    resetForm();
  };

  const showSection = evidence.length > 0 || canAttach;

  if (!showSection) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Evidence ({evidence.length})
        </p>
        {canAttach && onAttach && !showAttachForm && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAttachForm(true)}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Attach evidence
          </Button>
        )}
      </div>

      {showAttachForm && canAttach && onAttach && (
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={EVIDENCE_ACCEPT}
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              {file ? 'Choose another file' : 'Choose file'}
            </Button>
            {file && (
              <span className="text-xs text-foreground truncate max-w-full">
                {file.name}
                <span className="text-muted-foreground"> · {formatBytes(file.size)}</span>
              </span>
            )}
          </div>
          <LegacyInput
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why you are adding this (optional, shown on the case)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <p className="text-[11px] text-muted-foreground">
            Stored on our side and opened through a short-lived link, so access can be revoked.
            Images, PDFs, video and office documents up to 25 MB.
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={attach}
              disabled={!file || isAttaching}
              isLoading={isAttaching}
            >
              <Paperclip className="w-3.5 h-3.5" />
              Attach to case
            </Button>
            <Button variant="outline" size="sm" onClick={resetForm} disabled={isAttaching}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {evidence.length === 0 && <p className="text-xs text-muted-foreground">{emptyHint}</p>}

      {evidence.length > 0 && (
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
                      External link recorded before uploads were supported — we did not receive this
                      file.
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
                      resolveUrl={onResolveUrl ? () => onResolveUrl(item.id) : undefined}
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
      )}
    </div>
  );
};
