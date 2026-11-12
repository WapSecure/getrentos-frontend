'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Dumbbell, Plus, Trash2 } from '@sureground/icons';
import {
  Button,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  ListSkeleton,
  Skeleton,
  PageHeader,
  useToast,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { AmenityBookingRow } from '@/components/estate/amenities/AmenityBookingRow';
import type { AmenityBooking } from '@/types/estate';

export default function EstateAmenitiesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [cancelling, setCancelling] = useState<AmenityBooking | null>(null);
  const toast = useToast();

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
    onSuccess: () => {
      invalidateAmenities();
      if (deleting) toast.success(`"${deleting.name}" deleted.`);
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to delete this amenity.'),
  });

  const cancelBooking = useMutation({
    mutationFn: (bookingId: string) =>
      unwrap(estateService.cancelAmenityBooking(estate!.id, bookingId)),
    onSuccess: () => {
      invalidateBookings();
      if (cancelling) toast.success(`${cancelling.amenityName} booking cancelled.`);
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to cancel this booking.'),
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  return (
    <>
      <PageHeader
        title="Amenities"
        description={<>Shared facilities residents can book in {estate.name}</>}
      />

      <div className="bg-card rounded-2xl border border-border p-4 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-3">Amenities</h2>
        {isAmenitiesLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : !amenities || amenities.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No amenities yet"
            description="Add a facility below, such as a gym or hall, so residents can book it."
            size="compact"
            bare
            className="mb-3"
          />
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
                <IconButton
                  label={`Delete ${amenity.name}`}
                  icon={<Trash2 />}
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleting({ id: amenity.id, name: amenity.name })}
                  disabled={deleteAmenity.isPending}
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amenity name (e.g. Gym)"
            aria-label="Amenity name"
          />
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            aria-label="Description"
          />
        </div>
        <Button
          variant="primary"
          className="mt-3"
          icon={<Plus className="w-4 h-4" />}
          disabled={!name.trim()}
          isLoading={createAmenity.isPending}
          loadingText="Adding…"
          onClick={() => createAmenity.mutate()}
        >
          Add amenity
        </Button>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">
        Bookings ({bookings?.length ?? 0})
      </h2>
      {isBookingsLoading ? (
        <ListSkeleton rows={3} />
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
              onCancel={() => setCancelling(booking)}
              isUpdating={cancelBooking.isPending}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete this amenity?"
        description={
          deleting
            ? `"${deleting.name}" is deleted and residents can no longer book it. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => deleting && deleteAmenity.mutateAsync(deleting.id)}
        isLoading={deleteAmenity.isPending}
      />

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        title="Cancel this booking?"
        description={
          cancelling
            ? `${cancelling.unitLabel} (${cancelling.residentName}) loses their ${cancelling.amenityName} booking and the slot opens up for others. This can't be undone.`
            : ''
        }
        confirmLabel="Cancel booking"
        onConfirm={() => cancelling && cancelBooking.mutateAsync(cancelling.id)}
        isLoading={cancelBooking.isPending}
      />
    </>
  );
}
