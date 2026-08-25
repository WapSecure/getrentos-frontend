'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface Document {
  id: string;
  name: string;
  expiryDate?: string;
  status: 'active' | 'expiring' | 'expired';
}

interface DocumentExpiryAlertsProps {
  documents: Document[];
  summary?: { expiring: number; expired: number };
}

export const DocumentExpiryAlerts = ({ documents, summary }: DocumentExpiryAlertsProps) => {
  if (!summary) return null;

  const expiringDocsOnPage = documents.filter(
    (d) => d.status === 'expiring' || d.status === 'expired'
  );
  const needsAttention = summary.expiring + summary.expired;
  const visibleDocumentCount = Math.min(expiringDocsOnPage.length, 3);

  if (needsAttention === 0) {
    return (
      <div className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            All documents are up to date
          </span>
          <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
            No documents expiring soon
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-600" />
        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
          {needsAttention} document{needsAttention > 1 ? 's' : ''} need attention
        </span>
        <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-auto">
          {summary.expired} expired • {summary.expiring} expiring soon
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {expiringDocsOnPage.slice(0, 3).map((doc) => (
          <span key={doc.id} className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full">
            {doc.name}
          </span>
        ))}
        {needsAttention > visibleDocumentCount && (
          <span className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full">
            +{needsAttention - visibleDocumentCount} more
          </span>
        )}
        <Button size="sm" variant="ghost" className="text-xs">
          Review All
        </Button>
      </div>
    </div>
  );
};
