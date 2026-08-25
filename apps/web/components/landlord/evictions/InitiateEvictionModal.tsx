'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Gavel, TriangleAlert } from 'lucide-react';
import { Button, Pagination, Select, Textarea } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';

const PAGE_SIZE = 10;

interface InitiateEvictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leaseId: string, reason: string) => void;
  isSubmitting?: boolean;
}

export const InitiateEvictionModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: InitiateEvictionModalProps) => {
  const [leaseId, setLeaseId] = useState('');
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: [...landlordKeys.leases('signed'), { page, pageSize: PAGE_SIZE, eviction: true }],
    queryFn: () =>
      unwrap(landlordService.listLeases({ status: 'signed', page, pageSize: PAGE_SIZE })),
    enabled: isOpen,
  });
  const leases = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleClose = () => {
    setLeaseId('');
    setReason('');
    setPage(1);
    onClose();
  };

  const canSubmit = leaseId && reason.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Initiate Eviction Case</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 flex gap-2 text-xs text-amber-800 dark:text-amber-300">
                <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  This creates an internal draft case record. Review with legal counsel and confirm
                  compliance with your state&apos;s tenancy law before serving any notice.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Lease <span className="text-red-500">*</span>
                </label>
                <Select
                  value={leaseId}
                  onValueChange={setLeaseId}
                  placeholder="Select a signed lease"
                  options={leases.map((lease) => ({
                    value: lease.id,
                    label: `${lease.tenantName} — ${lease.propertyName} (${lease.unitName})`,
                  }))}
                />
                {leases.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No signed leases are available on this page to start an eviction case for.
                  </p>
                )}
                {total > 0 && (
                  <Pagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onPageChange={setPage}
                    className="mt-3"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Non-payment of rent for two consecutive months"
                  rows={4}
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                className="gap-1.5"
                onClick={() => onSubmit(leaseId, reason.trim())}
                disabled={!canSubmit || isSubmitting}
              >
                <Gavel className="w-3.5 h-3.5" />
                {isSubmitting ? 'Creating…' : 'Create Case'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
