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
import {
  CommercialDetailsFields,
  commercialError,
  commercialFromDetails,
  commercialToUpdatePayload,
  type CommercialValues,
} from './CommercialDetailsFields';

export function EditCommercialDetailsDialog({
  listing,
  onClose,
}: {
  listing: Listing | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
      {/* Keyed so each listing opens with its own saved details. */}
      {listing && <CommercialForm key={listing.id} listing={listing} onClose={onClose} />}
    </Dialog>
  );
}

function CommercialForm({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [values, setValues] = useState<CommercialValues>(() =>
    commercialFromDetails(listing.commercial)
  );
  const problem = commercialError(values);
  const save = useMutation({
    mutationFn: () =>
      unwrap(
        landlordService.updateListingCommercial(listing.id, commercialToUpdatePayload(values))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.listings() });
      toast.success('Commercial details saved');
      onClose();
    },
  });

  return (
    <DialogContent size="md" padded={false} className="flex flex-col">
      <div className="shrink-0 border-b border-border p-4 pr-12">
        <DialogTitle className="font-semibold text-foreground">Commercial details</DialogTitle>
        <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
          {listing.listingTitle}
        </DialogDescription>
      </div>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (!save.isPending && !problem) save.mutate();
        }}
      >
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <CommercialDetailsFields value={values} onChange={setValues} />
          {problem && <Alert variant="warning">{problem}</Alert>}
          {save.isError && (
            <Alert variant="danger">
              {save.error instanceof Error
                ? save.error.message
                : 'The details didn’t save. Try again.'}
            </Alert>
          )}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={save.isPending} disabled={!!problem}>
            Save details
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
