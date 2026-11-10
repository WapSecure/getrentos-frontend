'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  useToast,
} from '@sureground/ui';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { Listing } from '@/types/landlord';
import { ListingFeeFields, type ListingFeeValues } from './ListingFeeFields';

const toValue = (n?: number) => (n === undefined || n === null ? '' : String(n));
const toPayload = (v: string) => (v === '' ? null : Number(v));

export function EditListingFeesDialog({
  listing,
  onClose,
}: {
  listing: Listing | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
      {/* Keyed so each listing opens with its own saved fees. */}
      {listing && <FeesForm key={listing.id} listing={listing} onClose={onClose} />}
    </Dialog>
  );
}

function FeesForm({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [fees, setFees] = useState<ListingFeeValues>({
    serviceCharge: toValue(listing.serviceCharge),
    agencyFee: toValue(listing.agencyFee),
    legalFee: toValue(listing.legalFee),
  });
  const save = useMutation({
    mutationFn: () =>
      unwrap(
        landlordService.updateListingFees(listing.id, {
          serviceCharge: toPayload(fees.serviceCharge),
          agencyFee: toPayload(fees.agencyFee),
          legalFee: toPayload(fees.legalFee),
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.listings() });
      toast.success('Fees saved');
      onClose();
    },
  });

  return (
    <DialogContent size="md">
      <DialogTitle className="pr-8 font-semibold text-foreground">Move-in fees</DialogTitle>
      <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
        {listing.listingTitle}
      </DialogDescription>
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!save.isPending) save.mutate();
        }}
      >
        <ListingFeeFields
          value={fees}
          onChange={setFees}
          annualRent={listing.askingRent * (listing.rentPeriod === 'month' ? 12 : 1)}
        />
        {save.isError && (
          <Alert variant="danger">
            {save.error instanceof Error ? save.error.message : 'The fees didn’t save. Try again.'}
          </Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            Save fees
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
