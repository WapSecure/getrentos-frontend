'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';

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
              <h3 className="font-semibold text-foreground">Version History</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="h-24 animate-pulse bg-secondary m-4 rounded-lg" aria-busy="true" />
              ) : (
                <div className="divide-y divide-border">
                  {versions.map((version) => (
                    <div key={version.id} className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Version {version.version}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {version.size} · Uploaded {formatDate(version.createdAt)}
                        </p>
                      </div>
                      <a
                        href={version.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground shrink-0"
                      >
                        <Download className="w-4 h-4" />
                      </a>
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
