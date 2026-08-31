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
import {
  CalendarX,
  CreditCard,
  Gavel,
  Heart,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  Star,
} from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import { ShortletMessagesInbox } from './ShortletMessagesInbox';
import { ShortletReviewDialog } from './ShortletReviewDialog';
import { ShortletWishlistDialog } from './ShortletWishlistDialog';
import { ShortletDisputesInbox } from './ShortletDisputesInbox';
import { ShortletOpenDisputeDialog } from './ShortletOpenDisputeDialog';
import { ShortletDepositClaimsInbox } from './ShortletDepositClaimsInbox';
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
  const [disputesOpen, setDisputesOpen] = useState(false);
  const [claimsOpen, setClaimsOpen] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<ShortletBooking | null>(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...shortletKeys.guestBookings, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(shortletService.myBookings({ page, pageSize: PAGE_SIZE })),
  });
  const bookings = data?.items ?? [];

  const { data: guestReviews } = useQuery({
    queryKey: shortletKeys.guestReviews,
    queryFn: () => unwrap(shortletService.myGuestReviews(1, 50)),
  });
  const guestRatingCount = guestReviews?.total ?? 0;
  const guestRatingAverage =
    guestRatingCount > 0
      ? Math.round(
          ((guestReviews?.items ?? []).reduce((s, r) => s + r.rating, 0) / guestRatingCount) * 10
        ) / 10
      : undefined;

  const cancel = useMutation({
    mutationFn: (bookingId: string) => unwrap(shortletService.cancelBooking(bookingId)),
    onSuccess: (cancelled: ShortletBooking) => {
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: shortletKeys.guestBookings });
      const totalRefund =
        (cancelled.refundAmount ?? 0) +
        (cancelled.deposit != null && cancelled.depositStatus === 'REFUNDED'
          ? cancelled.deposit
          : 0);
      if (totalRefund > 0) {
        setToast({
          message: `Booking cancelled — ${formatCurrency(totalRefund)} refunded.`,
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
          {guestRatingAverage != null && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Your guest rating:{' '}
              <span className="font-medium text-foreground">{guestRatingAverage.toFixed(1)}</span>
              <span>
                ({guestRatingCount} review{guestRatingCount === 1 ? '' : 's'})
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMessagesOpen(true)}>
            <MessageSquare className="mr-1.5 h-4 w-4" /> Messages
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDisputesOpen(true)}>
            <Gavel className="mr-1.5 h-4 w-4" /> Disputes
          </Button>
          <Button variant="outline" size="sm" onClick={() => setClaimsOpen(true)}>
            <ShieldAlert className="mr-1.5 h-4 w-4" /> Deposit claims
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWishlistOpen(true)}>
            <Heart className="mr-1.5 h-4 w-4" /> Saved
          </Button>
        </div>
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
                  {b.deposit != null && b.depositStatus === 'HELD' && (
                    <Badge variant="info" className="mt-1">
                      Deposit held {formatCurrency(b.deposit)}
                    </Badge>
                  )}
                  {b.deposit != null && b.depositStatus === 'REFUNDED' && (
                    <Badge variant="success" className="mt-1">
                      <RotateCcw className="mr-1 h-3 w-3" /> Deposit refunded{' '}
                      {formatCurrency(b.deposit)}
                    </Badge>
                  )}
                  {b.taxAmount != null && b.taxAmount > 0 && (
                    <Badge variant="neutral" className="mt-1">
                      Tax {formatCurrency(b.taxAmount)}
                    </Badge>
                  )}
                  {b.depositClaimStatus && (
                    <Badge
                      variant={
                        b.depositClaimStatus === 'PENDING'
                          ? 'warning'
                          : b.depositClaimStatus === 'REJECTED'
                            ? 'success'
                            : 'danger'
                      }
                      className="mt-1"
                    >
                      <ShieldAlert className="mr-1 h-3 w-3" /> Claim{' '}
                      {b.depositClaimStatus.toLowerCase()}
                      {b.depositClaimAmount != null
                        ? ` ${formatCurrency(b.depositClaimAmount)}`
                        : ''}
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
                      {pay.isPending
                        ? 'Processing…'
                        : `Pay ${formatCurrency((b.total ?? 0) + (b.taxAmount ?? 0) + (b.deposit ?? 0))}`}
                    </Button>
                  )}
                  {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
                    <Button variant="outline" size="sm" onClick={() => setDisputeTarget(b)}>
                      <Gavel className="mr-1.5 h-4 w-4" /> Open dispute
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
      <Dialog open={disputesOpen} onOpenChange={(o) => !o && setDisputesOpen(false)}>
        <DialogContent className="sm:max-w-3xl">
          <ShortletDisputesInbox />
        </DialogContent>
      </Dialog>
      <Dialog open={claimsOpen} onOpenChange={(o) => !o && setClaimsOpen(false)}>
        <DialogContent className="sm:max-w-2xl">
          <ShortletDepositClaimsInbox role="guest" />
        </DialogContent>
      </Dialog>
      {wishlistOpen && <ShortletWishlistDialog onClose={() => setWishlistOpen(false)} />}
      {disputeTarget && (
        <ShortletOpenDisputeDialog
          booking={disputeTarget}
          onClose={() => setDisputeTarget(null)}
          onOpened={() => {
            setDisputeTarget(null);
            queryClient.invalidateQueries({ queryKey: shortletKeys.disputes });
            setToast({
              message: 'Dispute opened — the other party has been notified.',
              variant: 'success',
            });
          }}
        />
      )}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
