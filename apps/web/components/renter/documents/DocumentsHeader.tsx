'use client';

import { Upload, Shield } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface DocumentsHeaderProps {
  documentCount: number;
  onUpload: () => void;
}

export const DocumentsHeader = ({ documentCount, onUpload }: DocumentsHeaderProps) => {
  return (
    <RenterPageHeader
      eyebrow="Home records"
      icon={Shield}
      title="My documents"
      description="Keep lease records, receipts, inspections, and supporting documents organised in one place."
      actions={
        <Button variant="primary" className="gap-2" size="sm" onClick={onUpload}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          Upload document
        </Button>
      }
    >
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {documentCount} document{documentCount === 1 ? '' : 's'} in your private workspace
            </p>
            <p className="text-xs text-muted-foreground">
              Sharing remains under your control from each document&apos;s actions.
            </p>
          </div>
        </div>
      </div>
    </RenterPageHeader>
  );
};
