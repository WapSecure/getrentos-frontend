'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Plus, Trash2 } from 'lucide-react';
import { Button, EmptyState, LegacyInput } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { AmenityBookingRow } from '@/components/estate/amenities/AmenityBookingRow';

export default function EstateAmenitiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data: amenities, isLoading: isAmenitiesLoading } = useQuery({
    queryKey: estateKeys.amenities(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listAmenities(estate!.id)),
    enabled: !!estate,
  });

  const { data: bookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: estateKeys.amenityBookings(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listAmenityBookings(estate!.id)),
    enabled: !!estate,
  });

  const invalidateAmenities = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: estateKeys.amenities(estate.id) });
  };
  const invalidateBookings = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: estateKeys.amenityBookings(estate.id) });
  };

  const createAmenity = useMutation({
    mutationFn: () =>
      unwrap(
        estateService.createAmenity(estate!.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        })
      ),
    onSuccess: () => {
      setName('');
      setDescription('');
      invalidateAmenities();
    },
  });

  const deleteAmenity = useMutation({
    mutationFn: (amenityId: string) => unwrap(estateService.deleteAmenity(estate!.id, amenityId)),
    onSuccess: invalidateAmenities,
  });

  const cancelBooking = useMutation({
    mutationFn: (bookingId: string) =>
      unwrap(estateService.cancelAmenityBooking(estate!.id, bookingId)),
    onSuccess: invalidateBookings,
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Amenities</h1>
        <p className="text-muted-foreground mt-1">
          Shared facilities residents can book in {estate.name}
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-3">Amenities</h2>
        {isAmenitiesLoading ? (
          <div className="h-12 animate-pulse rounded-lg bg-secondary" aria-busy="true" />
        ) : !amenities || amenities.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">No amenities configured yet.</p>
        ) : (
          <div className="divide-y divide-border mb-3">
            {amenities.map((amenity) => (
              <div key={amenity.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{amenity.name}</p>
                  {amenity.description && (
                    <p className="text-xs text-muted-foreground truncate">{amenity.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteAmenity.mutate(amenity.id)}
                  disabled={deleteAmenity.isPending}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <LegacyInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amenity name (e.g. Gym)"
          />
          <LegacyInput
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
        </div>
        <Button
          variant="primary"
          className="gap-2 mt-3"
          disabled={!name.trim() || createAmenity.isPending}
          onClick={() => createAmenity.mutate()}
        >
          <Plus className="w-4 h-4" />
          {createAmenity.isPending ? 'Adding…' : 'Add Amenity'}
        </Button>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">
        Bookings ({bookings?.length ?? 0})
      </h2>
      {isBookingsLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : !bookings || bookings.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={CalendarCheck}
            title="No bookings yet"
            description="Resident bookings for these amenities will show up here."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {bookings.map((booking) => (
            <AmenityBookingRow
              key={booking.id}
              booking={booking}
              showHousehold
              onCancel={() => cancelBooking.mutate(booking.id)}
              isUpdating={cancelBooking.isPending}
            />
          ))}
        </div>
      )}
    </>
  );
}
