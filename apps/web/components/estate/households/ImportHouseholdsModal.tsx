'use client';

import { useState } from 'react';
import { Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
} from '@getrentos/ui';
import type { ImportHouseholdsResult } from '@/types/estate';

const TEMPLATE_CSV =
  'unitLabel,residentName,contactPhone,contactEmail\n' +
  'Block A Plot 1,Chidi Okoro,08012345678,chidi@example.com\n';
const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`;

interface ImportHouseholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
  isSubmitting?: boolean;
  result: ImportHouseholdsResult | null;
}

export const ImportHouseholdsModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  result,
}: ImportHouseholdsModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const handleClose = () => {
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">
          Import Households
        </DialogTitle>

        <div className="mt-4 space-y-4">
          {!result ? (
            <>
              <DialogDescription className="text-sm text-muted-foreground">
                Upload a CSV with columns <code>unitLabel</code>, <code>residentName</code>, and
                optionally <code>contactPhone</code> / <code>contactEmail</code>.
              </DialogDescription>
              <a
                href={TEMPLATE_HREF}
                download="households-template.csv"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Download CSV template
              </a>
              <DocumentUpload
                value={file ? [{ id: 'file', file }] : []}
                onChange={(items) => setFile(items[0]?.file ?? null)}
                accept=".csv"
                multiple={false}
                label="CSV file"
              />
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">
                  {result.created} household{result.created === 1 ? '' : 's'} imported
                  {result.failed > 0 ? `, ${result.failed} failed` : ''}
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                  {result.errors.map((error, index) => (
                    <div key={index} className="p-3 flex items-start gap-2 text-sm">
                      <AlertTriangle
                        className="w-4 h-4 text-warning shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-foreground">
                          Row {error.row}
                          {error.unitLabel ? ` (${error.unitLabel})` : ''}
                        </p>
                        <p className="text-muted-foreground">{error.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {!result ? (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!file}
                isLoading={isSubmitting}
                loadingText="Importing…"
                onClick={() => file && onSubmit(file)}
              >
                Import
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
