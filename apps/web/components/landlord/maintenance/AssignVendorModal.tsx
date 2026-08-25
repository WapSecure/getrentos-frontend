'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Star } from 'lucide-react';
import { Pagination } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import type { LandlordMaintenanceRequest } from '@/types/landlord';

const PAGE_SIZE = 10;

interface AssignVendorModalProps {
  request: LandlordMaintenanceRequest | null;
  onClose: () => void;
  onAssign: (requestId: string, vendorId: string) => void;
  /** The vendor currently being assigned, if any, so the row shows in-flight feedback. */
  assigningVendorId?: string | null;
}

export const AssignVendorModal = ({
  request,
  onClose,
  onAssign,
  assigningVendorId = null,
}: AssignVendorModalProps) => {
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: [...landlordKeys.vendors, { page, pageSize: PAGE_SIZE, assignment: true }],
    queryFn: () => unwrap(landlordService.listVendors({ page, pageSize: PAGE_SIZE })),
    enabled: !!request,
  });
  const vendors = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <AnimatePresence>
      {request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">Assign Vendor</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{request.issueTitle}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {vendors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No vendors in your directory yet. Add one from the Vendors page.
                </p>
              ) : (
                vendors.map((vendor) => {
                  const isAssigning = assigningVendorId === vendor.id;
                  return (
                    <button
                      key={vendor.id}
                      onClick={() => onAssign(request.id, vendor.id)}
                      disabled={assigningVendorId !== null}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors text-left disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.serviceType}</p>
                      </div>
                      {isAssigning ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                          {vendor.rating.toFixed(1)}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
              {total > 0 && (
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={setPage}
                  className="pt-3"
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
