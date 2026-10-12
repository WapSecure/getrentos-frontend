'use client';

import { useState } from 'react';
import { Link2, Upload } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
} from '@getrentos/ui';
import type {
  LandDiligenceCheck,
  LandDiligenceDocument,
  LandDiligenceDocumentLinkInput,
} from '@/types/land';
import { humaniseEnum } from '@/lib/landDiligence';
import { LandDocumentPreview } from './shared';

export interface CiteTarget {
  documentId?: string;
  checkKey?: string;
}

interface LandCiteDocumentDialogProps {
  target: CiteTarget | null;
  onClose: () => void;
  /** Documents not yet cited: a document can back one check at a time. */
  documents: LandDiligenceDocument[];
  checks: LandDiligenceCheck[];
  onSubmit: (input: LandDiligenceDocumentLinkInput) => void;
  isPending: boolean;
  onResolveUrl?: (documentId: string) => Promise<string | null | undefined>;
  /** Switches to uploading a new document, cited on the chosen check. */
  onUploadInstead?: (checkKey?: string) => void;
}

/**
 * Cite a property document against a check. Keyed by the page on the target,
 * so the initial state always reflects what was clicked.
 */
export const LandCiteDocumentDialog = ({
  target,
  onClose,
  documents,
  checks,
  onSubmit,
  isPending,
  onResolveUrl,
  onUploadInstead,
}: LandCiteDocumentDialogProps) => {
  const [documentId, setDocumentId] = useState(target?.documentId ?? '');
  const [checkKey, setCheckKey] = useState(target?.checkKey ?? '');
  const [note, setNote] = useState('');
  const selected = documents.find((document) => document.id === documentId);

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && !isPending && onClose()}>
      {target && (
        <DialogContent className="max-w-lg">
          <div className="space-y-4 p-5">
            <div>
              <DialogTitle className="type-heading text-lg">Cite a document</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Record which of the owner&apos;s documents a check rests on. The file stays where it
                is; the review records its reliance on it.
              </DialogDescription>
            </div>

            {documents.length === 0 ? (
              <p className="rounded-xl bg-secondary/50 px-3 py-2.5 text-sm text-muted-foreground">
                Every document on this property is already cited. Stop citing one first, or ask the
                owner to upload the missing evidence.
              </p>
            ) : (
              <>
                <Field label="Document" required>
                  <Select
                    value={documentId}
                    onValueChange={setDocumentId}
                    placeholder="Choose a document"
                    ariaLabel="Document to cite"
                    options={documents.map((document) => ({
                      value: document.id,
                      label: `${document.name} · ${humaniseEnum(document.documentType)}`,
                    }))}
                  />
                </Field>
                {selected && (
                  <div className="flex justify-end">
                    <LandDocumentPreview document={selected} onResolveUrl={onResolveUrl} />
                  </div>
                )}
                <Field label="Check it answers" hint="Passing a document-backed check needs this.">
                  <Select
                    value={checkKey}
                    onValueChange={setCheckKey}
                    ariaLabel="Check this document answers"
                    options={[
                      { value: '', label: 'Not tied to a check' },
                      ...checks.map((check) => ({ value: check.key, label: check.label })),
                    ]}
                  />
                </Field>
                <Field label="Why this document" hint="Optional, kept in the audit trail.">
                  <Input
                    value={note}
                    maxLength={1000}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="e.g. Registered survey plan matches the declared plot"
                  />
                </Field>
              </>
            )}

            {onUploadInstead && (
              <p className="text-sm text-muted-foreground">
                Not on the property yet?{' '}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  onClick={() => onUploadInstead(checkKey || undefined)}
                  disabled={isPending}
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload a document and cite it
                </button>
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!documentId || isPending}
                isLoading={isPending}
                icon={<Link2 className="h-4 w-4" />}
                onClick={() =>
                  onSubmit({
                    documentId,
                    checklistKey: checkKey || undefined,
                    note: note.trim() || undefined,
                  })
                }
              >
                Cite document
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
