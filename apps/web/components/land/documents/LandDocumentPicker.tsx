'use client';

import { useId, useMemo, useState } from 'react';
import { Button, DocumentPreviewButton, Field, IconButton, Select } from '@sureground/ui';
import { Upload, X } from '@sureground/icons';
import { formatDate } from '@/lib/format';
import type { LandDocumentType } from '@/types/landDocument';
import { errorMessage } from '../developer/feedback';
import { landDocumentTypeLabel } from './landDocumentRules';
import { isUploadReady, LandDocumentUploadFields } from './LandDocumentUploadFields';
import { useLandDocuments, useUploadLandDocument } from './useLandDocuments';

const ALL_TYPES = '__all__';
const NONE = '';

interface LandDocumentPickerProps {
  propertyId: string | null | undefined;
  label: string;
  /** '' for none. */
  value: string;
  onChange: (documentId: string) => void;
  hint?: string;
  suggestedType?: LandDocumentType;
  disabled?: boolean;
}

export const LandDocumentPicker = ({
  propertyId,
  label,
  value,
  onChange,
  hint,
  suggestedType,
  disabled,
}: LandDocumentPickerProps) => {
  const id = useId();
  const { data, isLoading, isError, error } = useLandDocuments(propertyId);
  const upload = useUploadLandDocument(propertyId ?? '');
  const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<LandDocumentType | ''>(suggestedType ?? '');
  const [file, setFile] = useState<File | null>(null);

  const documents = useMemo(() => data ?? [], [data]);
  const selected = documents.find((document) => document.id === value);
  const presentTypes = useMemo(
    () => Array.from(new Set(documents.map((document) => document.documentType))),
    [documents]
  );
  const visible = documents.filter(
    (document) =>
      typeFilter === ALL_TYPES || document.documentType === typeFilter || document.id === value
  );

  const documentOptions = [
    { value: NONE, label: 'No document' },
    ...visible.map((document) => ({
      value: document.id,
      label: `${document.name} · ${landDocumentTypeLabel(document.documentType)}`,
      searchText: `${document.name} ${landDocumentTypeLabel(document.documentType)}`,
    })),
    // A saved reference no longer listed stays visible.
    ...(value && !selected && !isLoading
      ? [{ value, label: 'A document no longer on this property' }]
      : []),
  ];

  const closeUpload = () => {
    setUploading(false);
    setFile(null);
    setUploadType(suggestedType ?? '');
    upload.reset();
  };

  const submitUpload = () => {
    if (!file || !uploadType || !isUploadReady(uploadType, file)) return;
    upload.mutate(
      { documentType: uploadType, file },
      {
        onSuccess: (document) => {
          onChange(document.id);
          setTypeFilter(ALL_TYPES);
          closeUpload();
        },
      }
    );
  };

  if (!propertyId) {
    return (
      <Field label={label}>
        <p className="rounded-xl bg-secondary/50 px-3 py-2.5 text-sm text-muted-foreground">
          Documents can be attached once the property is known.
        </p>
      </Field>
    );
  }

  // Not a Field: a Field names every control inside it with its label, and the type filter
  // needs a name of its own.
  return (
    <div role="group" aria-labelledby={`${id}-label`} className="space-y-1.5">
      <p id={`${id}-label`} className="text-sm font-medium tracking-[-0.01em] text-foreground">
        {label}
      </p>
      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
            options={[
              { value: ALL_TYPES, label: 'All types' },
              ...presentTypes.map((type) => ({ value: type, label: landDocumentTypeLabel(type) })),
            ]}
            ariaLabel="Filter documents by type"
            searchable={false}
            disabled={disabled || documents.length === 0}
          />
          <Select
            value={value}
            onValueChange={onChange}
            options={documentOptions}
            placeholder={isLoading ? 'Loading documents…' : 'No document'}
            ariaLabel={label}
            searchable={documentOptions.length > 8}
            disabled={disabled || isLoading}
          />
        </div>

        {isError && (
          <p className="text-xs text-destructive" role="status">
            {errorMessage(error, 'The documents on this property could not be loaded.')}
          </p>
        )}
        {!isLoading && !isError && documents.length === 0 && !uploading && (
          <p className="text-xs text-muted-foreground">
            No documents are on this property yet. Upload one to attach it.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {selected && (
            <>
              <span className="text-xs text-muted-foreground">
                Uploaded {formatDate(selected.uploadedAt)}
              </span>
              {selected.kind === 'STORED' && selected.url && (
                <DocumentPreviewButton
                  file={{ url: selected.url, name: selected.name, mimeType: selected.mimeType }}
                  label="Preview"
                />
              )}
            </>
          )}
          {!uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              rounded="lg"
              onClick={() => setUploading(true)}
              disabled={disabled}
              icon={<Upload className="h-4 w-4" />}
            >
              Upload new
            </Button>
          )}
        </div>

        {uploading && (
          <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Upload a document</p>
              <IconButton
                label="Cancel upload"
                size="sm"
                icon={<X />}
                onClick={closeUpload}
                disabled={upload.isPending}
              />
            </div>
            <LandDocumentUploadFields
              id={`${id}-upload`}
              documentType={uploadType}
              onDocumentTypeChange={setUploadType}
              file={file}
              onFileChange={setFile}
              disabled={upload.isPending}
            />
            {upload.isError && (
              <p className="text-xs text-destructive" role="status">
                {errorMessage(upload.error, 'The document could not be uploaded.')}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                rounded="lg"
                onClick={submitUpload}
                disabled={!isUploadReady(uploadType, file)}
                isLoading={upload.isPending}
                icon={<Upload className="h-4 w-4" />}
              >
                Upload and attach
              </Button>
            </div>
          </div>
        )}
        <p className="text-xs leading-5 text-muted-foreground">
          {hint ?? 'Optional. A document filed on this property.'}
        </p>
      </div>
    </div>
  );
};
