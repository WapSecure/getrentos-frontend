'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@getrentos/ui';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[85vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">Import Households</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {!result ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV with columns <code>unitLabel</code>, <code>residentName</code>, and
                    optionally <code>contactPhone</code> / <code>contactEmail</code>.
                  </p>
                  <a
                    href={TEMPLATE_HREF}
                    download="households-template.csv"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV template
                  </a>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      CSV file
                    </label>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <p className="text-sm font-medium text-foreground">
                      {result.created} household{result.created === 1 ? '' : 's'} imported
                      {result.failed > 0 ? `, ${result.failed} failed` : ''}
                    </p>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                      {result.errors.map((error, index) => (
                        <div key={index} className="p-3 flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
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

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              {!result ? (
                <>
                  <Button variant="ghost" fullWidth onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!file || isSubmitting}
                    onClick={() => file && onSubmit(file)}
                  >
                    {isSubmitting ? 'Importing…' : 'Import'}
                  </Button>
                </>
              ) : (
                <Button variant="primary" fullWidth onClick={handleClose}>
                  Done
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
