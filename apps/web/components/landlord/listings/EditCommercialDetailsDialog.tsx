'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  useToast,
} from '@sureground/ui';
import type { CommercialDetails } from '@sureground/shared/showroom';
import { landlordService } from '@/services/landlordService';
import { unwrap, type ApiResponse } from '@/lib/apiHelpers';
import type { CommercialDeal, CommercialUpdatePayload } from '@/lib/commercialDetails';
import { landlordKeys } from '@/lib/queryKeys';
import type { Listing } from '@/types/landlord';
import {
  CommercialDetailsFields,
  commercialError,
  commercialFromDetails,
  commercialToUpdatePayload,
  type CommercialValues,
} from './CommercialDetailsFields';

/** The listing being edited: enough to title the dialog and prefill it. */
export interface CommercialDetailsTarget {
  id: string;
  title: string;
  commercial?: CommercialDetails;
}

interface CommercialDetailsDialogProps {
  target: CommercialDetailsTarget | null;
  onClose: () => void;
  /** Sends every field, with null for "not stated", to the route for this kind of listing. */
  save: (id: string, details: CommercialUpdatePayload) => Promise<ApiResponse<unknown>>;
  /** The list to refresh once saved. */
  invalidate: QueryKey;
  deal?: CommercialDeal;
}

/** Edits a commercial listing's stated details; landlord, owner and realtor listings share it. */
export function CommercialDetailsDialog({
  target,
  onClose,
  ...rest
}: CommercialDetailsDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      {/* Keyed so each listing opens with its own saved details. */}
      {target && <CommercialForm key={target.id} target={target} onClose={onClose} {...rest} />}
    </Dialog>
  );
}

export function EditCommercialDetailsDialog({
  listing,
  onClose,
}: {
  listing: Listing | null;
  onClose: () => void;
}) {
  return (
    <CommercialDetailsDialog
      target={
        listing
          ? { id: listing.id, title: listing.listingTitle, commercial: listing.commercial }
          : null
      }
      onClose={onClose}
      save={(id, details) => landlordService.updateListingCommercial(id, details)}
      invalidate={landlordKeys.listings()}
    />
  );
}

function CommercialForm({
  target,
  onClose,
  save: send,
  invalidate,
  deal,
}: Omit<CommercialDetailsDialogProps, 'target'> & { target: CommercialDetailsTarget }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [values, setValues] = useState<CommercialValues>(() =>
    commercialFromDetails(target.commercial)
  );
  const problem = commercialError(values);
  const save = useMutation({
    mutationFn: () => unwrap(send(target.id, commercialToUpdatePayload(values))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidate });
      toast.success('Commercial details saved');
      onClose();
    },
  });

  return (
    <DialogContent size="md" padded={false} className="flex flex-col">
      <div className="shrink-0 border-b border-border p-4 pr-12">
        <DialogTitle className="font-semibold text-foreground">Commercial details</DialogTitle>
        <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
          {target.title}
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
          <CommercialDetailsFields value={values} onChange={setValues} deal={deal} />
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
