'use client';

import { useId, useState } from 'react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentPreviewButton,
} from '@getrentos/ui';
import { FileText, FolderOpen, Trash2, Upload } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { LandDocument, LandDocumentType } from '@/types/landDocument';
import { errorMessage, type Notify } from '../developer/feedback';
import { landDocumentTypeLabel } from './landDocumentRules';
import { isUploadReady, LandDocumentUploadFields } from './LandDocumentUploadFields';
import {
  usageLabels,
  useDeleteLandDocument,
  useLandDocuments,
  useUploadLandDocument,
} from './useLandDocuments';

/** Anchor the review panel links to when documents are what blocks submission. */
export const LAND_DOCUMENTS_ANCHOR = 'land-documents';

const UploadDialog = ({
  propertyId,
  open,
  onOpenChange,
  notify,
}: {
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notify: Notify;
}) => {
  const id = useId();
  const upload = useUploadLandDocument(propertyId);
  const [documentType, setDocumentType] = useState<LandDocumentType | ''>('');
  const [file, setFile] = useState<File | null>(null);

  const close = (next: boolean) => {
    if (upload.isPending) return;
    if (!next) {
      setDocumentType('');
      setFile(null);
      upload.reset();
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="text-lg font-semibold text-foreground">
          Upload a document
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          Title instruments, the survey plan, search reports and receipts. Compliance and any
          professional engaged on the review can open what you upload.
        </DialogDescription>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!documentType || !file || !isUploadReady(documentType, file)) return;
            upload.mutate(
              { documentType, file },
              {
                onSuccess: (document) => {
                  notify(`${document.name} uploaded.`);
                  close(false);
                },
              }
            );
          }}
        >
          <LandDocumentUploadFields
            id={id}
            documentType={documentType}
            onDocumentTypeChange={setDocumentType}
            file={file}
            onFileChange={setFile}
            disabled={upload.isPending}
          />
          {upload.isError && (
            <p className="text-sm text-destructive" role="status">
              {errorMessage(upload.error, 'The document could not be uploaded.')}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => close(false)}
              disabled={upload.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isUploadReady(documentType, file)}
              isLoading={upload.isPending}
              icon={<Upload className="h-4 w-4" />}
            >
              Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DocumentRow = ({
  document,
  onDelete,
}: {
  document: LandDocument;
  onDelete: (document: LandDocument) => void;
}) => {
  const usedBy = usageLabels(document);
  return (
    <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{document.name}</p>
          <p className="text-xs text-muted-foreground">
            {landDocumentTypeLabel(document.documentType)} · uploaded{' '}
            {formatDate(document.uploadedAt)}
          </p>
          {usedBy.length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Where this document is used">
              {usedBy.map((label) => (
                <li key={label}>
                  <Badge variant="info">{label}</Badge>
                </li>
              ))}
            </ul>
          )}
          {!document.canDelete && (
            <p className="mt-1 text-xs text-muted-foreground">
              {usedBy.length > 0
                ? 'Relied on as evidence, so it cannot be deleted.'
                : 'Only the owner or whoever uploaded it can delete it.'}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
        {document.kind === 'STORED' && document.url && (
          <DocumentPreviewButton
            file={{ url: document.url, name: document.name, mimeType: document.mimeType }}
            label="Preview"
          />
        )}
        {document.canDelete && (
          <Button
            variant="ghost"
            size="sm"
            rounded="lg"
            className="text-destructive"
            onClick={() => onDelete(document)}
            icon={<Trash2 className="h-4 w-4" />}
            aria-label={`Delete ${document.name}`}
          >
            Delete
          </Button>
        )}
      </div>
    </li>
  );
};

/**
 * The parcel's document file: titles, survey plan, search reports, layout
 * plans. Diligence, the estate layout, conveyance steps and the chain of title
 * all cite these, and anything cited stays.
 */
export const LandDocumentsSection = ({
  propertyId,
  notify,
}: {
  propertyId: string;
  notify: Notify;
}) => {
  const { data, isLoading, isError, error, refetch } = useLandDocuments(propertyId);
  const remove = useDeleteLandDocument(propertyId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<LandDocument | null>(null);

  return (
    <section
      id={LAND_DOCUMENTS_ANCHOR}
      tabIndex={-1}
      aria-labelledby={`${LAND_DOCUMENTS_ANCHOR}-heading`}
      className="mt-4 scroll-mt-24 rounded-2xl outline-none border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Documents
          </p>
          <h2
            id={`${LAND_DOCUMENTS_ANCHOR}-heading`}
            className="mt-1 font-semibold text-foreground"
          >
            Title, survey and supporting papers
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Upload the title instrument and survey plan before submitting for review. Documents
            cited by the review, your layout or a sale stay on file.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          rounded="lg"
          onClick={() => setUploadOpen(true)}
          icon={<Upload className="h-4 w-4" />}
        >
          Upload document
        </Button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-secondary" aria-busy="true" />
        ) : isError ? (
          <p className="text-sm text-destructive">
            {errorMessage(error, 'The documents could not be loaded.')}{' '}
            <button type="button" className="font-medium underline" onClick={() => refetch()}>
              Try again
            </button>
          </p>
        ) : !data || data.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <FolderOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
            No documents yet. Start with the title instrument (e.g. the C of O or deed) and the
            survey plan.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {data.map((document) => (
              <DocumentRow key={document.id} document={document} onDelete={setDeleting} />
            ))}
          </ul>
        )}
      </div>

      <UploadDialog
        propertyId={propertyId}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        notify={notify}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this document?"
        description={`${deleting?.name ?? 'This document'} will be removed from the property. This cannot be undone.`}
        confirmLabel="Delete document"
        isLoading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            notify('Document deleted.');
          } catch (reason) {
            notify(errorMessage(reason), 'error');
          }
        }}
      />
    </section>
  );
};
