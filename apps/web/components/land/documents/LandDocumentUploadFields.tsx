'use client';

import { useRef } from 'react';
import { Field, Select } from '@getrentos/ui';
import { FileUp, X } from 'lucide-react';
import type { LandDocumentType } from '@/types/landDocument';
import {
  LAND_DOCUMENT_ACCEPT,
  LAND_DOCUMENT_FILE_HINT,
  LAND_DOCUMENT_TYPE_OPTIONS,
  landDocumentFileProblem,
} from './landDocumentRules';

const sizeLabel = (bytes: number) =>
  bytes > 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

interface LandDocumentUploadFieldsProps {
  /** Prefix for the inputs' ids, from `useId`. */
  id: string;
  documentType: LandDocumentType | '';
  onDocumentTypeChange: (value: LandDocumentType) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

/**
 * What the document is, and the file. Controlled, so each caller owns the
 * submit: the parcel's documents, the inline "upload new" of a picker, or an
 * outside reviewer's evidence.
 */
export const LandDocumentUploadFields = ({
  id,
  documentType,
  onDocumentTypeChange,
  file,
  onFileChange,
  disabled,
}: LandDocumentUploadFieldsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const problem = file ? landDocumentFileProblem(file) : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Document type" required>
        <Select
          value={documentType}
          onValueChange={(value) => onDocumentTypeChange(value as LandDocumentType)}
          options={LAND_DOCUMENT_TYPE_OPTIONS}
          placeholder="Choose a type"
          ariaLabel="Document type"
          searchable
          disabled={disabled}
        />
      </Field>
      <Field
        label="File"
        htmlFor={`${id}-file`}
        required
        hint={LAND_DOCUMENT_FILE_HINT}
        error={problem ?? undefined}
      >
        <div className="flex min-w-0 items-center gap-2">
          <input
            ref={inputRef}
            id={`${id}-file`}
            type="file"
            accept={LAND_DOCUMENT_ACCEPT}
            disabled={disabled}
            aria-describedby={`${id}-file-chosen`}
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="block w-full min-w-0 text-sm text-muted-foreground file:mr-3 file:inline-flex file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-secondary disabled:opacity-60"
          />
          {file && !disabled && (
            <button
              type="button"
              onClick={() => {
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Clear the chosen file"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p id={`${id}-file-chosen`} className="mt-1 flex items-center gap-1 text-xs">
          {file ? (
            <>
              <FileUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="truncate text-foreground">{file.name}</span>
              <span className="text-muted-foreground">· {sizeLabel(file.size)}</span>
            </>
          ) : (
            <span className="sr-only">No file chosen</span>
          )}
        </p>
      </Field>
    </div>
  );
};

/** True when the fields hold an upload the API should accept. */
export const isUploadReady = (documentType: LandDocumentType | '', file: File | null) =>
  Boolean(documentType && file && !landDocumentFileProblem(file));
