'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Megaphone, Pause, Play, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import type { SaleListing, SaleListingStatus } from '@/types/owner';

interface ManageListingModalProps {
  listing: SaleListing | null;
  onClose: () => void;
  onChangeStatus: (listingId: string, status: SaleListingStatus) => void;
}

export const ManageListingModal = ({
  listing,
  onClose,
  onChangeStatus,
}: ManageListingModalProps) => {
  if (!listing) return null;

  const setStatus = (status: SaleListingStatus) => {
    onChangeStatus(listing.id, status);
    onClose();
  };

  return (
    <AnimatePresence>
      {listing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Manage Listing</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {listing.listingTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Property</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {listing.propertyName}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Asking Price</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(listing.askingPrice)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {listing.status === 'draft' && (
                  <Button
                    variant="primary"
                    className="w-full gap-2"
                    onClick={() => setStatus('published')}
                  >
                    <Megaphone className="w-4 h-4" />
                    Publish Listing
                  </Button>
                )}
                {listing.status === 'published' && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setStatus('paused')}
                  >
                    <Pause className="w-4 h-4" />
                    Pause Listing
                  </Button>
                )}
                {listing.status === 'paused' && (
                  <Button
                    variant="primary"
                    className="w-full gap-2"
                    onClick={() => setStatus('published')}
                  >
                    <Play className="w-4 h-4" />
                    Resume Listing
                  </Button>
                )}
                {(listing.status === 'published' || listing.status === 'paused') && (
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-red-600 dark:text-red-400"
                    onClick={() => setStatus('closed')}
                  >
                    <XCircle className="w-4 h-4" />
                    Close Listing
                  </Button>
                )}
                {listing.status === 'closed' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    This listing is closed.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
