'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import type { LandlordMaintenanceRequest, Vendor } from '@/types/landlord';

interface AssignVendorModalProps {
  request: LandlordMaintenanceRequest | null;
  vendors: Vendor[];
  onClose: () => void;
  onAssign: (requestId: string, vendor: Vendor) => void;
}

export const AssignVendorModal = ({
  request,
  vendors,
  onClose,
  onAssign,
}: AssignVendorModalProps) => {
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
                vendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => onAssign(request.id, vendor)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.serviceType}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      {vendor.rating.toFixed(1)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
