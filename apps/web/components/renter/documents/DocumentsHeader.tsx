'use client';

import { Upload, Shield } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface DocumentsHeaderProps {
  documentCount: number;
  onUpload: () => void;
}

export const DocumentsHeader = ({ documentCount, onUpload }: DocumentsHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your rental documents securely in one place
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" className="gap-2" size="sm" onClick={onUpload}>
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {documentCount} documents • Securely stored • End-to-end encrypted
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Your documents are private and only accessible to you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
