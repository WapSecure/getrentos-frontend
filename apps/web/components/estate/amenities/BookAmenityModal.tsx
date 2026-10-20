'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import {
  DateTimeField,
  isCompleteDateTime,
  isFutureDateTime,
} from '@/components/shared/forms/DateTimeField';
import type { Amenity } from '@/types/estate';

interface BookAmenityModalProps {
  isOpen: boolean;
  amenity: Amenity | null;
  onClose: () => void;
  onSubmit: (data: { amenityId: string; startsAt: string; endsAt: string }) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const BookAmenityModal = ({
  isOpen,
  amenity,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: BookAmenityModalProps) => {
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const handleClose = () => {
    setStartsAt('');
    setEndsAt('');
    onClose();
  };

  const endsBeforeStart =
    isCompleteDateTime(startsAt) &&
    isCompleteDateTime(endsAt) &&
    new Date(endsAt).getTime() <= new Date(startsAt).getTime();
  const canSubmit =
    !!amenity && isFutureDateTime(startsAt) && isCompleteDateTime(endsAt) && !endsBeforeStart;

  return (
    <Dialog open={isOpen && !!amenity} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm">
        {amenity && (
          <>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Book {amenity.name}
            </DialogTitle>

            <div className="mt-4 space-y-4">
              <DateTimeField label="Starts" value={startsAt} onChange={setStartsAt} requireFuture />
              <div>
                <DateTimeField
                  label="Ends"
                  value={endsAt}
                  onChange={setEndsAt}
                  minDate={startsAt.split('T')[0] || undefined}
                />
                {endsBeforeStart && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    The end time must be after the start time.
                  </p>
                )}
              </div>
              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!canSubmit}
                isLoading={isSubmitting}
                loadingText="Booking…"
                onClick={() =>
                  onSubmit({
                    amenityId: amenity.id,
                    startsAt: new Date(startsAt).toISOString(),
                    endsAt: new Date(endsAt).toISOString(),
                  })
                }
              >
                Book
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
