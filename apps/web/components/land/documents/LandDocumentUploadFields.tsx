'use client';

import { DocumentUpload, Field, Select } from '@sureground/ui';
import type { LandDocumentType } from '@/types/landDocument';
import {
  LAND_DOCUMENT_ACCEPT,
  LAND_DOCUMENT_FILE_HINT,
  LAND_DOCUMENT_MAX_MB,
  LAND_DOCUMENT_TYPE_OPTIONS,
  landDocumentFileProblem,
} from './landDocumentRules';

interface LandDocumentUploadFieldsProps {
  id: string;
  documentType: LandDocumentType | '';
  onDocumentTypeChange: (value: LandDocumentType) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export const LandDocumentUploadFields = ({
  id,
  documentType,
  onDocumentTypeChange,
  file,
  onFileChange,
  disabled,
}: LandDocumentUploadFieldsProps) => {
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
      <Field label="File" required error={problem ?? undefined}>
        <DocumentUpload
          checkPhotoQuality
          value={file ? [{ id: `${id}-file`, file }] : []}
          onChange={(next) => onFileChange(next[0]?.file ?? null)}
          accept={LAND_DOCUMENT_ACCEPT}
          multiple={false}
          maxSizeMB={LAND_DOCUMENT_MAX_MB}
          hint={LAND_DOCUMENT_FILE_HINT}
          disabled={disabled}
        />
      </Field>
    </div>
  );
};

export const isUploadReady = (documentType: LandDocumentType | '', file: File | null) =>
  Boolean(documentType && file && !landDocumentFileProblem(file));
