'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import {
  prePurchaseInspectionKeys,
  prePurchaseInspectionService,
} from '@/services/landPrePurchaseInspectionService';
import {
  INSPECTION_FOCUS_LABELS,
  PRE_PURCHASE_DISCLAIMER,
  type InspectionFocus,
} from '@/types/landPrePurchaseInspection';

export const BUYER_INSPECTIONS_ROUTE = '/buyer/land/inspections';
const FOCUS = Object.keys(INSPECTION_FOCUS_LABELS) as InspectionFocus[];

/**
 * Commission an independent, accredited inspector to visit land before buying
 * it. Every photo is geotagged and timestamped; the report reaches the buyer
 * once GetRentos has checked it.
 */
export const RequestInspectionDialog = ({
  open,
  onClose,
  target,
  landName,
}: {
  open: boolean;
  onClose: () => void;
  target: { listingId: string } | { plotId: string };
  landName: string;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [focus, setFocus] = useState<InspectionFocus[]>(FOCUS);
  const [notes, setNotes] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => unwrap(prePurchaseInspectionService.request({ ...target, focus, notes })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prePurchaseInspectionKeys.mine });
      router.push(BUYER_INSPECTIONS_ROUTE);
    },
    onError: (reason: Error) => setError(reason.message),
  });

  const close = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-lg space-y-4">
        <div>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Commission an independent inspection
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {landName}. An accredited inspector visits within 10 days. Every photo is geotagged and
            timestamped, and GetRentos checks the report before you see it.
          </DialogDescription>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Ask the inspector to</legend>
          {FOCUS.map((key) => (
            <label key={key} className="flex items-start gap-2 text-sm text-foreground">
              <Checkbox
                checked={focus.includes(key)}
                onCheckedChange={(on) =>
                  setFocus((current) => (on ? [...current, key] : current.filter((f) => f !== key)))
                }
                aria-label={INSPECTION_FOCUS_LABELS[key]}
              />
              {INSPECTION_FOCUS_LABELS[key]}
            </label>
          ))}
        </fieldset>
        <Field label="Anything else (optional)" htmlFor="inspection-notes">
          <Textarea
            id="inspection-notes"
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. the seller says the plot is fenced; please confirm"
          />
        </Field>
        <label className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
          <Checkbox
            checked={accepted}
            onCheckedChange={setAccepted}
            aria-label="I understand an inspection is not a search"
          />
          <span>{PRE_PURCHASE_DISCLAIMER}</span>
        </label>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={submit.isPending}>
            Cancel
          </Button>
          <Button
            disabled={!accepted || submit.isPending}
            isLoading={submit.isPending}
            onClick={() => {
              setError(null);
              submit.mutate();
            }}
          >
            Commission inspection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
