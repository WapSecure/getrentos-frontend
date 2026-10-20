'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react';
import { Button, EmptyState, ListSkeleton } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { BookAmenityModal } from '@/components/estate/amenities/BookAmenityModal';
import { AmenityBookingRow } from '@/components/estate/amenities/AmenityBookingRow';
import type { Amenity } from '@/types/estate';

export default function ResidentAmenitiesPage() {
  const queryClient = useQueryClient();
  const [bookingTarget, setBookingTarget] = useState<Amenity | null>(null);

  const { data: amenities, isLoading: isAmenitiesLoading } = useQuery({
    queryKey: estateResidentKeys.amenities,
    queryFn: () => unwrap(estateResidentService.listAmenities()),
  });

  const { data: bookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: estateResidentKeys.amenityBookings,
    queryFn: () => unwrap(estateResidentService.listMyAmenityBookings()),
  });

  const invalidateBookings = () =>
    queryClient.invalidateQueries({ queryKey: estateResidentKeys.amenityBookings });

  const bookAmenity = useMutation({
    mutationFn: (data: Parameters<typeof estateResidentService.bookAmenity>[0]) =>
      unwrap(estateResidentService.bookAmenity(data)),
    onSuccess: () => {
      invalidateBookings();
      setBookingTarget(null);
    },
  });

  const cancelBooking = useMutation({
    mutationFn: (bookingId: string) =>
      unwrap(estateResidentService.cancelMyAmenityBooking(bookingId)),
    onSuccess: invalidateBookings,
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Amenities</h1>
        <p className="text-muted-foreground mt-1">Book shared facilities in your estate</p>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Available</h2>
      {isAmenitiesLoading ? (
        <ListSkeleton rows={2} className="mb-8" />
      ) : !amenities || amenities.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No amenities yet"
          description="Your estate manager hasn't added any bookable amenities."
          className="mb-8"
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden mb-8">
          {amenities.map((amenity) => (
            <div key={amenity.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{amenity.name}</p>
                {amenity.description && (
                  <p className="text-xs text-muted-foreground truncate">{amenity.description}</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setBookingTarget(amenity)}>
                Book
              </Button>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm font-semibold text-foreground mb-3">
        My Bookings ({bookings?.length ?? 0})
      </h2>
      {isBookingsLoading ? (
        <ListSkeleton rows={2} />
      ) : !bookings || bookings.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="You haven't booked anything yet." size="compact" />
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {bookings.map((booking) => (
            <AmenityBookingRow
              key={booking.id}
              booking={booking}
              onCancel={() => cancelBooking.mutate(booking.id)}
              isUpdating={cancelBooking.isPending}
            />
          ))}
        </div>
      )}

      <BookAmenityModal
        isOpen={!!bookingTarget}
        amenity={bookingTarget}
        onClose={() => setBookingTarget(null)}
        onSubmit={(data) => bookAmenity.mutate(data)}
        isSubmitting={bookAmenity.isPending}
        error={bookAmenity.error instanceof Error ? bookAmenity.error.message : null}
      />
    </>
  );
}
