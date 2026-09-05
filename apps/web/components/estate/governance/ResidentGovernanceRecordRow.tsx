'use client';

import { Download, FileText, PenLine } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import type { GovernanceRecord } from '@/types/estate';

const typeVariant: Record<GovernanceRecord['type'], 'info' | 'neutral'> = {
  bylaws: 'info',
  meeting_minutes: 'neutral',
  other: 'neutral',
};

const typeLabels: Record<GovernanceRecord['type'], string> = {
  bylaws: 'Bylaws',
  meeting_minutes: 'Meeting Minutes',
  other: 'Other',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

interface ResidentGovernanceRecordRowProps {
  record: GovernanceRecord;
  onSign?: () => void;
}

export const ResidentGovernanceRecordRow = ({
  record,
  onSign,
}: ResidentGovernanceRecordRowProps) => {
  const needsMySignature = record.requiresSignatures && record.signedByMe === false;

  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground truncate">{record.title}</p>
            <Badge variant={typeVariant[record.type]}>{typeLabels[record.type]}</Badge>
            {record.requiresSignatures && record.signatureProgress && (
              <Badge variant={record.status === 'approved' ? 'success' : 'warning'}>
                {record.status === 'approved'
                  ? 'Fully signed'
                  : `${record.signatureProgress.signed} of ${record.signatureProgress.total} signed`}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {record.meetingDate ? `Meeting ${formatDate(record.meetingDate)} · ` : ''}
            {record.size} · Uploaded {formatDate(record.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {needsMySignature && onSign && (
          <Button variant="primary" size="sm" className="gap-1.5" onClick={onSign}>
            <PenLine className="w-3.5 h-3.5" />
            Sign
          </Button>
        )}
        <a
          href={record.url}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
