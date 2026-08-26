'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  EmptyState,
  Pagination,
  Skeleton,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { CalendarX, MapPin } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ShortletBooking, ShortletBookingStatus } from '@/types/shortlet';

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

export const GuestBookingsWorkspace = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...shortletKeys.guestBookings, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(shortletService.myBookings({ page, pageSize: PAGE_SIZE })),
  });
  const bookings = data?.items ?? [];

  const cancel = useMutation({
    mutationFn: (bookingId: string) => unwrap(shortletService.cancelBooking(bookingId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.guestBookings });
      setToast({ message: 'Booking cancelled.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My Shortlet Bookings</h1>
        <p className="mt-1 text-muted-foreground">Track your stays and requests.</p>
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
                  {b.paymentReference && (
                    <p className="text-xs text-muted-foreground">Ref {b.paymentReference}</p>
                  )}
                </div>
              </div>
              {canCancel(b) && (
                <div className="mt-3 flex justify-end border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancel.mutate(b.id)}
                    disabled={cancel.isPending}
                  >
                    <CalendarX className="mr-1.5 h-4 w-4" /> Cancel booking
                  </Button>
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
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
