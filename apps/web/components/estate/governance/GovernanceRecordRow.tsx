'use client';

import { Download, Trash2, FileText } from 'lucide-react';
import { Badge } from '@getrentos/ui';
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

interface GovernanceRecordRowProps {
  record: GovernanceRecord;
  onRemove: () => void;
}

export const GovernanceRecordRow = ({ record, onRemove }: GovernanceRecordRowProps) => {
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">{record.title}</p>
            <Badge variant={typeVariant[record.type]}>{typeLabels[record.type]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {record.meetingDate ? `Meeting ${formatDate(record.meetingDate)} · ` : ''}
            {record.size} · Uploaded {formatDate(record.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={record.url}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
        >
          <Download className="w-4 h-4" />
        </a>
        <button
          onClick={onRemove}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
