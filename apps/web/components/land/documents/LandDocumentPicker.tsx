'use client';

import { useId, useMemo, useState } from 'react';
import { Button, DocumentPreviewButton, Field, IconButton, Select } from '@getrentos/ui';
import { Upload, X } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { LandDocumentType } from '@/types/landDocument';
import { errorMessage } from '../developer/feedback';
import { landDocumentTypeLabel } from './landDocumentRules';
import { isUploadReady, LandDocumentUploadFields } from './LandDocumentUploadFields';
import { useLandDocuments, useUploadLandDocument } from './useLandDocuments';

const ALL_TYPES = '__all__';
const NONE = '';

interface LandDocumentPickerProps {
  /** The land property whose documents may be chosen. */
  propertyId: string | null | undefined;
  label: string;
  /** The chosen document id; '' for none. */
  value: string;
  onChange: (documentId: string) => void;
  hint?: string;
  /** Type preselected for the filter and for "Upload new", e.g. LAYOUT_PLAN. */
  suggestedType?: LandDocumentType;
  disabled?: boolean;
}

/**
 * Choose one of the property's documents, or upload a new one and choose it.
 *
 * The API links milestones, layouts and title entries to a document already on
 * the property, so this lists those documents (filterable by type, each with a
 * preview) and offers an inline upload for the one that is not there yet. It
 * renders no form of its own, so it can sit inside the caller's form.
 */
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
    // A reference saved earlier that is no longer listed (e.g. removed) stays visible.
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

  return (
    <Field label={label} hint={hint ?? 'Optional. A document filed on this property.'}>
      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
            options={[
              { value: ALL_TYPES, label: 'All types' },
              ...presentTypes.map((type) => ({ value: type, label: landDocumentTypeLabel(type) })),
            ]}
            ariaLabel={`${label}: filter by document type`}
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
      </div>
    </Field>
  );
};
