'use client';

import { useId, useState } from 'react';
import { Button, ConfirmDialog, DocumentPreviewButton, Field, Input, Select } from '@getrentos/ui';
import { Link2, Upload, X } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { LandDocumentType } from '@/types/landDocument';
import type {
  LandReviewCheck,
  LandReviewCiteInput,
  LandReviewDocument,
  LandReviewUploadInput,
} from '@/types/landReviewer';
import { landDocumentTypeLabel } from '../documents/landDocumentRules';
import { isUploadReady, LandDocumentUploadFields } from '../documents/LandDocumentUploadFields';

export interface ReviewEvidenceActions {
  /** Each resolves once the refreshed case is stored; a rejection is reported by the caller. */
  upload: (input: LandReviewUploadInput) => Promise<unknown>;
  cite: (input: LandReviewCiteInput) => Promise<unknown>;
  uncite: (documentId: string) => Promise<unknown>;
  /** Which check (by key) has an evidence request in flight. */
  busyKey: string | null;
  /**
   * The reviewer's own name, to tell their citations from GetRentos staff's: the
   * case only says who cited a document by name. Null when unknown, in which
   * case Remove is offered and the API refuses anything not theirs.
   */
}

type Mode = 'idle' | 'upload' | 'cite';

/**
 * The evidence a document-backed check rests on, and the reviewer's ways to
 * supply it: upload their own file (e.g. a registry search report) cited on
 * the check, or cite a document already on the property.
 */
export const ReviewCheckEvidence = ({
  check,
  documents,
  actions,
}: {
  check: LandReviewCheck;
  documents: LandReviewDocument[];
  actions: ReviewEvidenceActions;
}) => {
  const id = useId();
  const [mode, setMode] = useState<Mode>('idle');
  const [documentType, setDocumentType] = useState<LandDocumentType | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [note, setNote] = useState('');
  const [removing, setRemoving] = useState<LandReviewDocument | null>(null);

  const busy = actions.busyKey === check.key;
  // One document can back several checks, so each check reads its own citation.
  const linkOn = (document: LandReviewDocument) =>
    (document.links ?? (document.link ? [document.link] : [])).find(
      (link) => link.checklistKey === check.key
    );
  const cited = documents.filter((document) => linkOn(document));
  const citable = documents.filter((document) => !linkOn(document));
  const isMine = (document: LandReviewDocument) => linkOn(document)?.linkedByMe === true;

  const reset = () => {
    setMode('idle');
    setDocumentType('');
    setFile(null);
    setDocumentId('');
    setNote('');
  };

  const submit = async () => {
    try {
      if (mode === 'upload' && documentType && file) {
        await actions.upload({ documentType, file, checklistKey: check.key, note });
      } else if (mode === 'cite' && documentId) {
        await actions.cite({ documentId, checklistKey: check.key, note });
      } else {
        return;
      }
      reset();
    } catch {
      // Reported by the caller; the form stays filled in to try again.
    }
  };

  const ready =
    mode === 'upload' ? isUploadReady(documentType, file) : mode === 'cite' && Boolean(documentId);

  return (
    <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">Evidence for this check</p>
      {cited.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing cited yet. Upload the document you relied on, or cite one already on the property.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {cited.map((document) => {
            const link = linkOn(document);
            return (
              <li key={document.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {document.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {landDocumentTypeLabel(document.documentType)} · cited by {link?.linkedByName}
                    {link?.linkedAt ? ` on ${formatDate(link.linkedAt)}` : ''}
                    {link?.note ? ` · “${link.note}”` : ''}
                  </span>
                </span>
                {document.kind === 'STORED' && document.url && (
                  <DocumentPreviewButton
                    file={{ url: document.url, name: document.name, mimeType: document.mimeType }}
                    label="Preview"
                  />
                )}
                {isMine(document) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={busy}
                    onClick={() => setRemoving(document)}
                    aria-label={`Remove the citation of ${document.name}`}
                  >
                    Remove
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {mode === 'idle' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode('upload')}
            icon={<Upload className="h-4 w-4" />}
          >
            Upload evidence
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('cite')}
            disabled={citable.length === 0}
            icon={<Link2 className="h-4 w-4" />}
            title={
              citable.length === 0
                ? 'Every document on the property is already cited on this check'
                : undefined
            }
          >
            Cite a property document
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              {mode === 'upload' ? 'Upload and cite on this check' : 'Cite a property document'}
            </p>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {mode === 'upload' ? (
            <LandDocumentUploadFields
              id={`${id}-upload`}
              documentType={documentType}
              onDocumentTypeChange={setDocumentType}
              file={file}
              onFileChange={setFile}
              disabled={busy}
            />
          ) : (
            <Field label="Document" required>
              <Select
                value={documentId}
                onValueChange={setDocumentId}
                placeholder="Choose a document"
                ariaLabel={`Document to cite on ${check.label}`}
                options={citable.map((document) => ({
                  value: document.id,
                  label: `${document.name} · ${landDocumentTypeLabel(document.documentType)}`,
                }))}
                disabled={busy}
              />
            </Field>
          )}
          <Field
            label="Why it supports the check"
            htmlFor={`${id}-note`}
            hint="Optional, kept in the audit trail."
          >
            <Input
              id={`${id}-note`}
              value={note}
              maxLength={1000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Registry search confirms the title number and owner"
              disabled={busy}
            />
          </Field>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={submit}
              disabled={!ready || busy}
              isLoading={busy}
              icon={
                mode === 'upload' ? <Upload className="h-4 w-4" /> : <Link2 className="h-4 w-4" />
              }
            >
              {mode === 'upload' ? 'Upload and cite' : 'Cite document'}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove this citation?"
        description={`${removing?.name ?? 'The document'} will no longer back "${check.label}". The file stays on the property. A passed check that needs evidence should then be revisited.`}
        confirmLabel="Remove citation"
        isLoading={busy}
        onConfirm={() => (removing ? actions.uncite(removing.id).catch(() => undefined) : null)}
      />
    </div>
  );
};
