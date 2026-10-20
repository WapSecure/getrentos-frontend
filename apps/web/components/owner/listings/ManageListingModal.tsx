'use client';

import { Megaphone, Pause, Play, XCircle } from 'lucide-react';
import {
  Button,
  DescriptionList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@getrentos/ui';
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0">
        <div className="border-b border-border p-4 pr-12">
          <DialogTitle className="font-semibold text-foreground">Manage Listing</DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
            {listing.listingTitle}
          </DialogDescription>
        </div>

        <div className="space-y-3 p-4">
          <DescriptionList
            layout="rows"
            className="rounded-lg border border-border px-3 [&>div]:py-2"
            items={[
              { label: 'Property', value: listing.propertyName },
              { label: 'Asking Price', value: formatCurrency(listing.askingPrice) },
            ]}
          />

          <div className="space-y-2">
            {listing.status === 'draft' && (
              <Button
                variant="primary"
                fullWidth
                onClick={() => setStatus('published')}
                icon={<Megaphone className="h-4 w-4" />}
              >
                Publish Listing
              </Button>
            )}
            {listing.status === 'published' && (
              <Button
                variant="outline"
                fullWidth
                onClick={() => setStatus('paused')}
                icon={<Pause className="h-4 w-4" />}
              >
                Pause Listing
              </Button>
            )}
            {listing.status === 'paused' && (
              <Button
                variant="primary"
                fullWidth
                onClick={() => setStatus('published')}
                icon={<Play className="h-4 w-4" />}
              >
                Resume Listing
              </Button>
            )}
            {(listing.status === 'published' || listing.status === 'paused') && (
              <Button
                variant="ghost"
                fullWidth
                className="text-destructive"
                onClick={() => setStatus('closed')}
                icon={<XCircle className="h-4 w-4" />}
              >
                Close Listing
              </Button>
            )}
            {listing.status === 'closed' && (
              <p className="py-2 text-center text-sm text-muted-foreground">
                This listing is closed.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
