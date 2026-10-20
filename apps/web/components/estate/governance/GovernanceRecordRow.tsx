'use client';

import { Download, Trash2, FileText, History, FilePlus2 } from 'lucide-react';
import { Badge, Button, IconButton } from '@getrentos/ui';
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
  onUploadNewVersion?: () => void;
  onViewHistory?: () => void;
  onViewSignatures?: () => void;
}

export const GovernanceRecordRow = ({
  record,
  onRemove,
  onUploadNewVersion,
  onViewHistory,
  onViewSignatures,
}: GovernanceRecordRowProps) => {
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
            {record.version > 1 && <Badge variant="neutral">v{record.version}</Badge>}
            {record.requiresSignatures && record.signatureProgress && (
              <button
                type="button"
                onClick={onViewSignatures}
                className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Badge variant={record.status === 'approved' ? 'success' : 'warning'}>
                  {record.status === 'approved'
                    ? 'Fully signed'
                    : `${record.signatureProgress.signed} of ${record.signatureProgress.total} signed`}
                </Badge>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {record.meetingDate ? `Meeting ${formatDate(record.meetingDate)} · ` : ''}
            {record.size} · Uploaded {formatDate(record.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {record.version > 1 && onViewHistory && (
          <IconButton
            label="View version history"
            icon={<History />}
            size="sm"
            onClick={onViewHistory}
          />
        )}
        {onUploadNewVersion && (
          <IconButton
            label="Upload new version"
            icon={<FilePlus2 />}
            size="sm"
            onClick={onUploadNewVersion}
          />
        )}
        <Button
          href={record.url}
          target="_blank"
          rel="noreferrer"
          variant="ghost"
          size="xs"
          className="h-8 w-8 px-0"
          aria-label={`Download ${record.title}`}
          title="Download"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
        </Button>
        <IconButton
          label={`Delete ${record.title}`}
          icon={<Trash2 />}
          variant="danger"
          size="sm"
          onClick={onRemove}
        />
      </div>
    </div>
  );
};
