'use client';

import { PenLine } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Dialog, DialogContent, DialogTitle, EmptyState, ListSkeleton } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { CommitteeTitle } from '@/types/estate';

interface GovernanceSignaturesModalProps {
  estateId: string;
  recordId: string | null;
  onClose: () => void;
}

const titleLabel: Record<CommitteeTitle, string> = {
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  member: 'Member',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

export const GovernanceSignaturesModal = ({
  estateId,
  recordId,
  onClose,
}: GovernanceSignaturesModalProps) => {
  const { data: signatures = [], isLoading } = useQuery({
    queryKey: estateKeys.governanceSignatures(estateId, recordId ?? ''),
    queryFn: () => unwrap(estateService.listGovernanceRecordSignatures(estateId, recordId!)),
    enabled: !!recordId,
  });

  return (
    <Dialog open={!!recordId} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">Signatures</DialogTitle>

        <div className="mt-4">
          {isLoading ? (
            <ListSkeleton rows={2} label="Loading signatures" />
          ) : signatures.length === 0 ? (
            <EmptyState
              icon={PenLine}
              size="compact"
              title="No signatures yet"
              description="Committee members haven't signed this document yet."
            />
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {signatures.map((signature) => (
                <div key={signature.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {signature.residentName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {signature.unitLabel} · Signed {formatDate(signature.signedAt)}
                    </p>
                  </div>
                  <Badge variant="neutral" className="shrink-0">
                    {titleLabel[signature.title]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
