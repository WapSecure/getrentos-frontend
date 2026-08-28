'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  EmptyState,
  Pagination,
  Skeleton,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { CalendarX, CreditCard, MapPin, MessageSquare, RotateCcw, Star } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import { ShortletMessagesInbox } from './ShortletMessagesInbox';
import { ShortletReviewDialog } from './ShortletReviewDialog';
import type {
  ShortletBooking,
  ShortletBookingStatus,
  ShortletCancellationPolicy,
} from '@/types/shortlet';

const PAGE_SIZE = 10;

const STATUS_VARIANT: Record<ShortletBookingStatus, BadgeVariant> = {
  REQUESTED: 'info',
  CONFIRMED: 'success',
  DECLINED: 'danger',
  CANCELLED: 'neutral',
  COMPLETED: 'neutral',
};

const canCancel = (b: ShortletBooking) =>
  (b.status === 'REQUESTED' || b.status === 'CONFIRMED') && new Date(b.checkIn) > new Date();

const POLICY_LABEL: Record<ShortletCancellationPolicy, string> = {
  FLEXIBLE: 'Flexible',
  MODERATE: 'Moderate',
  STRICT: 'Strict',
};

/** Mirrors the backend refund rules so guests see what they'd get back. */
function refundPercentFor(b: ShortletBooking, daysBefore: number): number {
  const policy = b.cancellationPolicy ?? 'FLEXIBLE';
  if (policy === 'FLEXIBLE') return daysBefore >= 1 ? 100 : 0;
  if (policy === 'MODERATE') return daysBefore >= 5 ? 100 : daysBefore >= 1 ? 50 : 0;
  return daysBefore >= 7 ? 100 : daysBefore >= 3 ? 50 : 0;
}

function cancelDescription(b: ShortletBooking): string {
  const daysBefore = Math.ceil(
    (new Date(b.checkIn).getTime() - new Date(new Date().toISOString().slice(0, 10)).getTime()) /
      86_400_000
  );
  const label = POLICY_LABEL[b.cancellationPolicy ?? 'FLEXIBLE'];
  if (b.paymentStatus === 'PAID') {
    const pct = refundPercentFor(b, daysBefore);
    if (pct > 0) {
      return `Under the ${label} policy you'll be refunded ${formatCurrency(
        Math.floor((b.total * pct) / 100)
      )} (${pct}%).`;
    }
    return `No refund applies under the ${label} policy this close to check-in.`;
  }
  return 'This will cancel your booking.';
}

export const GuestBookingsWorkspace = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<ShortletBooking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ShortletBooking | null>(null);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...shortletKeys.guestBookings, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(shortletService.myBookings({ page, pageSize: PAGE_SIZE })),
  });
  const bookings = data?.items ?? [];

  const cancel = useMutation({
    mutationFn: (bookingId: string) => unwrap(shortletService.cancelBooking(bookingId)),
    onSuccess: (cancelled: ShortletBooking) => {
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: shortletKeys.guestBookings });
      if (cancelled.refundAmount != null && cancelled.refundAmount > 0) {
        setToast({
          message: `Booking cancelled — ${formatCurrency(cancelled.refundAmount)} refunded.`,
          variant: 'success',
        });
      } else {
        setToast({ message: 'Booking cancelled.', variant: 'success' });
      }
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const pay = useMutation({
    mutationFn: (bookingId: string) => unwrap(shortletService.payBooking(bookingId)),
    onSuccess: (res) => {
      if (res.authorizationUrl) {
        // Real gateway flow — redirect to Paystack checkout.
        window.location.href = res.authorizationUrl;
        return;
      }
      queryClient.invalidateQueries({ queryKey: shortletKeys.guestBookings });
      setToast({ message: 'Payment received — your stay is confirmed.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Shortlet Bookings</h1>
          <p className="mt-1 text-muted-foreground">Track your stays and requests.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setMessagesOpen(true)}>
          <MessageSquare className="mr-1.5 h-4 w-4" /> Messages
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No bookings yet"
          description="Browse shortlet stays and book your next trip."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{b.propertyTitle}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {b.city}
                  </p>
                  <p className="mt-1 text-sm">
                    {formatDate(b.checkIn, 'long')} → {formatDate(b.checkOut, 'long')} · {b.nights}{' '}
                    night{b.nights > 1 ? 's' : ''} · {b.guestCount} guest
                    {b.guestCount > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
                  <p className="mt-1 font-semibold">{formatCurrency(b.total)}</p>
                  {b.paymentStatus && b.paymentStatus !== 'UNPAID' && (
                    <Badge
                      variant={b.paymentStatus === 'PAID' ? 'success' : 'info'}
                      className="mt-1"
                    >
                      {b.paymentStatus === 'PAID'
                        ? 'Paid'
                        : b.paymentStatus === 'PROCESSING'
                          ? 'Payment processing'
                          : b.paymentStatus}
                    </Badge>
                  )}
                  {b.paymentReference && (
                    <p className="text-xs text-muted-foreground">Ref {b.paymentReference}</p>
                  )}
                  {b.cancellationPolicy && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {POLICY_LABEL[b.cancellationPolicy]} cancellation
                    </p>
                  )}
                  {b.refundAmount != null && b.refundAmount > 0 && (
                    <Badge variant="info" className="mt-1">
                      <RotateCcw className="mr-1 h-3 w-3" /> Refunded{' '}
                      {formatCurrency(b.refundAmount)}
                    </Badge>
                  )}
                  {b.status === 'COMPLETED' && b.reviewed && (
                    <Badge variant="success" className="mt-1">
                      <Star className="mr-1 h-3 w-3" /> Reviewed
                    </Badge>
                  )}
                </div>
              </div>
              {(canCancel(b) || b.paymentRequired || (b.status === 'COMPLETED' && !b.reviewed)) && (
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                  {b.paymentRequired && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => pay.mutate(b.id)}
                      disabled={pay.isPending}
                    >
                      <CreditCard className="mr-1.5 h-4 w-4" />
                      {pay.isPending ? 'Processing…' : `Pay ${formatCurrency(b.total)}`}
                    </Button>
                  )}
                  {b.status === 'COMPLETED' && !b.reviewed && (
                    <Button variant="outline" size="sm" onClick={() => setReviewTarget(b)}>
                      <Star className="mr-1.5 h-4 w-4" /> Leave a review
                    </Button>
                  )}
                  {canCancel(b) && (
                    <Button variant="ghost" size="sm" onClick={() => setCancelTarget(b)}>
                      <CalendarX className="mr-1.5 h-4 w-4" /> Cancel booking
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancel this booking?"
        description={cancelTarget ? cancelDescription(cancelTarget) : ''}
        confirmLabel="Cancel booking"
        onConfirm={() => cancelTarget && cancel.mutate(cancelTarget.id)}
      />
      {reviewTarget && (
        <ShortletReviewDialog
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null);
            queryClient.invalidateQueries({ queryKey: shortletKeys.guestBookings });
            queryClient.invalidateQueries({ queryKey: shortletKeys.public });
            setToast({ message: 'Thanks! Your review was published.', variant: 'success' });
          }}
        />
      )}
      <Dialog open={messagesOpen} onOpenChange={(o) => !o && setMessagesOpen(false)}>
        <DialogContent className="sm:max-w-3xl">
          <ShortletMessagesInbox role="guest" />
        </DialogContent>
      </Dialog>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
