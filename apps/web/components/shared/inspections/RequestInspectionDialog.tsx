'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@sureground/ui/Button';
import { Checkbox } from '@sureground/ui/Checkbox';
import { CheckboxGroup } from '@sureground/ui/CheckboxGroup';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@sureground/ui/Dialog';
import { Field } from '@sureground/ui/Field';
import { Textarea } from '@sureground/ui/Textarea';
import { unwrap } from '@/lib/apiHelpers';
import { VISIT_ROUTES } from '@/lib/constants/visitRoutes';
import {
  prePurchaseInspectionKeys,
  prePurchaseInspectionService,
} from '@/services/prePurchaseInspectionService';
import {
  INSPECTION_FOCUS_LABELS,
  PRE_PURCHASE_DISCLAIMER,
  type InspectionFocus,
} from '@/types/prePurchaseInspection';
import type { TourPlace } from '@/types/siteTour';

const focusOptions = (place: TourPlace) =>
  Object.entries(INSPECTION_FOCUS_LABELS[place]).map(([key, label]) => ({
    value: key as InspectionFocus,
    label,
  }));

const COPY: Record<TourPlace, { notes: string; route: string }> = {
  land: {
    notes: 'e.g. the seller says the plot is fenced; please confirm',
    route: VISIT_ROUTES.BUYER_LAND_INSPECTIONS,
  },
  home: {
    notes: 'e.g. the seller says the roof was replaced last year; please check',
    route: VISIT_ROUTES.BUYER_INSPECTIONS,
  },
};

export const RequestInspectionDialog = ({
  open,
  onClose,
  target,
  placeName,
  place = 'land',
}: {
  open: boolean;
  onClose: () => void;
  target: { listingId: string } | { plotId: string };
  placeName: string;
  place?: TourPlace;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scope = place === 'land' ? 'land' : 'all';
  const options = focusOptions(place);
  const [focus, setFocus] = useState<InspectionFocus[]>(() => options.map((o) => o.value));
  const [notes, setNotes] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      unwrap(prePurchaseInspectionService.request(scope, { ...target, focus, notes })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prePurchaseInspectionKeys.mine(scope) });
      router.push(COPY[place].route);
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
            {placeName}. An accredited inspector visits within 10 days. Every photo is geotagged and
            timestamped, and Sureground checks the report before you see it.
          </DialogDescription>
        </div>
        <CheckboxGroup
          legend="Ask the inspector to"
          value={focus}
          onValueChange={setFocus}
          options={options}
        />
        <Field label="Anything else (optional)" htmlFor="inspection-notes">
          <Textarea
            id="inspection-notes"
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={COPY[place].notes}
          />
        </Field>
        <label className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
          <Checkbox
            checked={accepted}
            onCheckedChange={setAccepted}
            aria-label="I understand an inspection is not a search"
          />
          <span>{PRE_PURCHASE_DISCLAIMER[place]}</span>
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
