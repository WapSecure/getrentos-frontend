'use client';

import { useState } from 'react';
import { Clock, Download, FileText, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge, Card, IconButton } from '@getrentos/ui';

interface Version {
  id: string;
  version: number;
  date: string;
  size: string;
  user: string;
  comment?: string;
  isCurrent: boolean;
}

interface DocumentVersionHistoryProps {
  versions: Version[];
  documentName: string;
  onRestore: (versionId: string) => void;
  onDownload: (versionId: string) => void;
}

export const DocumentVersionHistory = ({
  versions,
  onRestore,
  onDownload,
}: DocumentVersionHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDownload = (versionId: string) => {
    onDownload(versionId);
  };

  const handleRestore = (versionId: string) => {
    onRestore(versionId);
  };

  return (
    <Card>
      <button
        type="button"
        onClick={handleToggleExpand}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Version History</h3>
            <p className="text-xs text-muted-foreground">{versions.length} versions</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div className="divide-y divide-border">
          {versions.map((version) => (
            <div key={version.id} className="p-4 hover:bg-secondary transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${version.isCurrent ? 'bg-success-subtle' : 'bg-secondary'}`}
                  >
                    <FileText
                      className={`h-4 w-4 ${version.isCurrent ? 'text-success' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">v{version.version}</span>
                      {version.isCurrent && <Badge variant="success">Current</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(version.date)} • {version.size} • by {version.user}
                    </p>
                    {version.comment && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        &quot;{version.comment}&quot;
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconButton
                    label={`Download version ${version.version}`}
                    size="sm"
                    icon={<Download />}
                    onClick={() => handleDownload(version.id)}
                  />
                  {!version.isCurrent && (
                    <IconButton
                      label={`Restore version ${version.version}`}
                      size="sm"
                      icon={<RotateCcw />}
                      onClick={() => handleRestore(version.id)}
                      className="text-info hover:bg-info-subtle hover:text-info"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
