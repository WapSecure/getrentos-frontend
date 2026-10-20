'use client';

import { Download, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { Dialog, DialogContent, DialogTitle, IconLink, ListSkeleton } from '@getrentos/ui';

interface GovernanceVersionsModalProps {
  estateId: string;
  recordId: string | null;
  onClose: () => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export const GovernanceVersionsModal = ({
  estateId,
  recordId,
  onClose,
}: GovernanceVersionsModalProps) => {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: estateKeys.governanceVersions(estateId, recordId ?? ''),
    queryFn: () => unwrap(estateService.listGovernanceRecordVersions(estateId, recordId!)),
    enabled: !!recordId,
  });

  return (
    <Dialog open={!!recordId} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">Version History</DialogTitle>

        <div className="mt-4">
          {isLoading ? (
            <ListSkeleton rows={2} />
          ) : (
            <div className="divide-y divide-border">
              {versions.map((version) => (
                <div key={version.id} className="py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">Version {version.version}</p>
                    <p className="text-xs text-muted-foreground">
                      {version.size} · Uploaded {formatDate(version.createdAt)}
                    </p>
                  </div>
                  <IconLink
                    href={version.url}
                    target="_blank"
                    rel="noreferrer"
                    label={`Download version ${version.version}`}
                    icon={<Download />}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
