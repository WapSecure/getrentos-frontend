'use client';

import { useId, useState } from 'react';
import { Upload } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  DocumentUpload,
  type PendingUpload,
} from '@getrentos/ui';
import { humaniseEnum } from '@/lib/landDiligence';
import { LAND_DOCUMENT_TYPES, type LandDiligenceCheck, type LandDocumentType } from '@/types/land';

/** The API's limits for a land document (file-upload.policy.ts). */
const MAX_BYTES = 20 * 1024 * 1024;
const MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ACCEPT = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', ...MIME_TYPES].join(',');
const FILE_HINT = 'PDF, JPEG, PNG, WebP, DOC or DOCX, up to 20 MB.';

const fileProblem = (file: File | null) => {
  if (!file) return null;
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_BYTES) return 'This file is larger than 20 MB.';
  if (file.type && !MIME_TYPES.includes(file.type)) return `Not accepted. Use ${FILE_HINT}`;
  return null;
};

const TYPE_OPTIONS = LAND_DOCUMENT_TYPES.map((value) => ({ value, label: humaniseEnum(value) }));

export interface LandUploadDocumentInput {
  documentType: LandDocumentType;
  file: File;
  /** Cite the upload on this check straight away. */
  checklistKey?: string;
  note?: string;
}

interface LandUploadDocumentDialogProps {
  /** Open when set; `checkKey` preselects the check to cite the upload on. */
  target: { checkKey?: string } | null;
  onClose: () => void;
  checks: LandDiligenceCheck[];
  onSubmit: (input: LandUploadDocumentInput) => void;
  isPending: boolean;
}

/**
 * Upload staff evidence onto the property (a registry search, a charting
 * report), optionally citing it on a check in the same step. Keyed by the
 * page on the target, so its state starts fresh each time it opens.
 */
export const LandUploadDocumentDialog = ({
  target,
  onClose,
  checks,
  onSubmit,
  isPending,
}: LandUploadDocumentDialogProps) => {
  const id = useId();
  const [documentType, setDocumentType] = useState<LandDocumentType | ''>('');
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const file = uploads[0]?.file ?? null;
  const [checkKey, setCheckKey] = useState(target?.checkKey ?? '');
  const [note, setNote] = useState('');
  const problem = fileProblem(file);
  const ready = Boolean(documentType && file && !problem);

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && !isPending && onClose()}>
      {target && (
        <DialogContent className="max-w-lg">
          <form
            className="space-y-4 p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!ready || !documentType || !file) return;
              onSubmit({
                documentType,
                file,
                checklistKey: checkKey || undefined,
                note: note.trim() || undefined,
              });
            }}
          >
            <div>
              <DialogTitle className="type-heading text-lg">Upload a document</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Adds the file to the property&apos;s documents, where it can back a check. The owner
                can see documents on their property.
              </DialogDescription>
            </div>

            <Field label="Document type" required>
              <Select
                value={documentType}
                onValueChange={(value) => setDocumentType(value as LandDocumentType)}
                options={TYPE_OPTIONS}
                placeholder="Choose a type"
                ariaLabel="Document type"
              />
            </Field>
            <Field
              label="File"
              htmlFor={`${id}-file`}
              required
              hint={FILE_HINT}
              error={problem ?? undefined}
            >
              <DocumentUpload
                value={uploads}
                onChange={setUploads}
                accept={ACCEPT}
                multiple={false}
                maxSizeMB={20}
                disabled={isPending}
              />
            </Field>
            <Field
              label="Cite it on a check"
              hint="Optional. Passing a document-backed check needs a citation."
            >
              <Select
                value={checkKey}
                onValueChange={setCheckKey}
                ariaLabel="Check to cite the upload on"
                options={[
                  { value: '', label: 'Do not cite yet' },
                  ...checks.map((check) => ({ value: check.key, label: check.label })),
                ]}
              />
            </Field>
            {checkKey && (
              <Field
                label="Why this document"
                htmlFor={`${id}-note`}
                hint="Optional, kept in the audit trail."
              >
                <Input
                  id={`${id}-note`}
                  value={note}
                  maxLength={1000}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="e.g. Registry search confirms the title number and owner"
                />
              </Field>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!ready || isPending}
                isLoading={isPending}
                icon={<Upload className="h-4 w-4" />}
              >
                {checkKey ? 'Upload and cite' : 'Upload'}
              </Button>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
};
