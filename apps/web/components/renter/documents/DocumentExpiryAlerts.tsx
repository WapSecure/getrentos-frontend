'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, Badge, Button } from '@sureground/ui';

interface Document {
  id: string;
  name: string;
  expiryDate?: string;
  status: 'active' | 'expiring' | 'expired';
}

interface DocumentExpiryAlertsProps {
  documents: Document[];
  summary?: { expiring: number; expired: number };
  onReview?: () => void;
}

export const DocumentExpiryAlerts = ({
  documents,
  summary,
  onReview,
}: DocumentExpiryAlertsProps) => {
  if (!summary) return null;

  const expiringDocsOnPage = documents.filter(
    (d) => d.status === 'expiring' || d.status === 'expired'
  );
  const needsAttention = summary.expiring + summary.expired;
  const visibleDocumentCount = Math.min(expiringDocsOnPage.length, 3);

  if (needsAttention === 0) {
    return (
      <Alert
        variant="success"
        icon={CheckCircle}
        title="All documents are up to date"
        className="mb-6"
      >
        No documents expiring soon
      </Alert>
    );
  }

  return (
    <Alert
      variant="warning"
      icon={AlertCircle}
      title={`${needsAttention} document${needsAttention > 1 ? 's' : ''} need attention`}
      className="mb-6"
    >
      <p>
        {summary.expired} expired • {summary.expiring} expiring soon
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {expiringDocsOnPage.slice(0, 3).map((doc) => (
          <Badge key={doc.id}>{doc.name}</Badge>
        ))}
        {needsAttention > visibleDocumentCount && (
          <Badge>+{needsAttention - visibleDocumentCount} more</Badge>
        )}
        {onReview && (
          <Button size="sm" variant="ghost" className="text-xs" onClick={onReview}>
            Review all
          </Button>
        )}
      </div>
    </Alert>
  );
};
