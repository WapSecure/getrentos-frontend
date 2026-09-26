'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Skeleton,
  Textarea,
} from '@getrentos/ui';
import { AlertTriangle } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import { shortletService } from '@/services/shortletService';
import type { ShortletBooking } from '@/types/shortlet';

const MIN_REASON = 10;

/**
 * The host calls off a confirmed stay. Before they commit, the dialog shows the
 * server's own numbers: what the guest gets back and what the host will owe.
 */
export function HostCancelBookingDialog({
  booking,
  onClose,
  onDone,
}: {
  booking: ShortletBooking;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: preview, isLoading } = useQuery({
    queryKey: ['shortlets', 'host', 'cancel-preview', booking.id],
    queryFn: () => unwrap(shortletService.previewHostCancel(booking.id)),
  });

  const cancel = useMutation({
    mutationFn: () => unwrap(shortletService.hostCancelBooking(booking.id, reason.trim())),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostBookings });
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostPayouts });
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostBlockedDates(booking.listingId) });
      onDone(
        preview && preview.fee > 0
          ? `Stay cancelled. The guest is being refunded; ${formatCurrency(preview.fee)} will come out of your next payouts.`
          : 'Stay cancelled.'
      );
    },
    onError: (e: Error) => setError(e.message),
  });

  const submit = () => {
    if (reason.trim().length < MIN_REASON) {
      setError(
        `Tell ${booking.guestName ?? 'the guest'} why, in at least ${MIN_REASON} characters.`
      );
      return;
    }
    setError(null);
    cancel.mutate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="p-5">
          <DialogTitle>Cancel this stay?</DialogTitle>
          <DialogDescription>
            {booking.guestName ?? 'Your guest'} · {booking.propertyTitle} ·{' '}
            {formatDate(booking.checkIn, 'short')} to {formatDate(booking.checkOut, 'short')}
          </DialogDescription>
        </div>
        <div className="space-y-4 border-t border-border p-5">
          {isLoading || !preview ? (
            <Skeleton className="h-28 w-full rounded-lg" />
          ) : !preview.canCancel ? (
            <p className="text-sm text-destructive">{preview.blockedReason}</p>
          ) : (
            <>
              <dl className="space-y-2 rounded-lg border border-border p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Guest gets back</dt>
                  <dd className="font-medium">
                    {preview.guestPaid ? formatCurrency(preview.guestRefund) : 'Nothing to refund'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    Your cancellation fee
                    {preview.fee > 0 &&
                      ` (${preview.feePercent}%, ${preview.daysBeforeCheckIn} day${preview.daysBeforeCheckIn === 1 ? '' : 's'} before check-in)`}
                  </dt>
                  <dd className={preview.fee > 0 ? 'font-medium text-destructive' : 'font-medium'}>
                    {preview.fee > 0 ? formatCurrency(preview.fee) : 'None'}
                  </dd>
                </div>
              </dl>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex gap-1.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  {preview.guestPaid
                    ? 'The guest is refunded in full, including tax and deposit, whatever your cancellation policy says.'
                    : "The guest hadn't paid yet, so there is no fee, but it still counts on your record."}
                </li>
                {preview.fee > 0 && (
                  <li className="flex gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                    The fee comes out of your next payouts. The closer to check-in, the higher it
                    is.
                  </li>
                )}
                <li className="flex gap-1.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  These dates stay closed, and guests see how many stays you cancelled in the last
                  12 months.
                </li>
              </ul>
              <Field label="Reason for the guest">
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. A pipe burst and the flat is being repaired."
                />
              </Field>
            </>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={cancel.isPending}>
              Keep the booking
            </Button>
            {preview?.canCancel && (
              <Button variant="danger" onClick={submit} disabled={cancel.isPending}>
                {cancel.isPending ? 'Cancelling…' : 'Cancel stay'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
