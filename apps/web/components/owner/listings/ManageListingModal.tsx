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
            className="bg-card rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Manage Listing</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{listing.listingTitle}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Property</span>
                  <span className="text-foreground font-medium">{listing.propertyName}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Asking Price</span>
                  <span className="text-foreground font-medium">
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
                  <p className="text-sm text-muted-foreground text-center py-2">
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
