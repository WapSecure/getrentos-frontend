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
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-md w-full overflow-hidden max-h-[80vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Assign Vendor</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {request.issueTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {vendors.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No vendors in your directory yet. Add one from the Vendors page.
                </p>
              ) : (
                vendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => onAssign(request.id, vendor)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#c4a747] transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {vendor.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {vendor.serviceType}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Star className="w-3.5 h-3.5 fill-[#c4a747] text-[#c4a747]" />
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
