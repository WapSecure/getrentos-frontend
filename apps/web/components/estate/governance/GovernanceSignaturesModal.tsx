'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, PenLine } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge, EmptyState } from '@getrentos/ui';
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
    <AnimatePresence>
      {recordId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">Signatures</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="h-24 animate-pulse bg-secondary m-4 rounded-lg" aria-busy="true" />
              ) : signatures.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={PenLine}
                    title="No signatures yet"
                    description="Committee members haven't signed this document yet."
                  />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {signatures.map((signature) => (
                    <div key={signature.id} className="p-4 flex items-center justify-between gap-3">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
