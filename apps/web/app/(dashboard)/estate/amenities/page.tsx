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
  PageHeader,
  useToast,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { AmenityBookingRow } from '@/components/estate/amenities/AmenityBookingRow';
import type { AmenityBooking } from '@/types/estate';
import {
  EstateListSection,
  EstateListSkeleton,
  EstateRow,
  EstateRowList,
  RowAvatar,
} from '@/components/estate/shared/EstateListSection';

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
        description={`Shared facilities residents can book in ${estate.name}.`}
      />

      <div className="space-y-6">
        <EstateListSection
          id="amenities"
          title="Amenities"
          count={isAmenitiesLoading ? undefined : (amenities?.length ?? 0)}
          countLabel={`${amenities?.length ?? 0} amenit${amenities?.length === 1 ? 'y' : 'ies'}`}
          description="Facilities residents can see and book from their dashboard."
          footer={
            <div className="py-1">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
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
                <Button
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  disabled={!name.trim()}
                  isLoading={createAmenity.isPending}
                  loadingText="Adding…"
                  onClick={() => createAmenity.mutate()}
                >
                  Add amenity
                </Button>
              </div>
            </div>
          }
        >
          {isAmenitiesLoading ? (
            <EstateListSkeleton rows={2} />
          ) : !amenities || amenities.length === 0 ? (
            <EmptyState
              bare
              size="compact"
              icon={Dumbbell}
              title="No amenities yet"
              description="Add a facility below, such as a gym or hall, so residents can book it."
            />
          ) : (
            <EstateRowList>
              {amenities.map((amenity) => (
                <li key={amenity.id}>
                  <EstateRow
                    leading={<RowAvatar icon={Dumbbell} />}
                    title={
                      <p className="truncate text-sm font-medium text-foreground">{amenity.name}</p>
                    }
                    meta={
                      amenity.description ? (
                        <p className="truncate">{amenity.description}</p>
                      ) : undefined
                    }
                    actions={
                      <IconButton
                        label={`Delete ${amenity.name}`}
                        icon={<Trash2 />}
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleting({ id: amenity.id, name: amenity.name })}
                        disabled={deleteAmenity.isPending}
                      />
                    }
                  />
                </li>
              ))}
            </EstateRowList>
          )}
        </EstateListSection>

        <EstateListSection
          id="amenity-bookings"
          title="Bookings"
          count={isBookingsLoading ? undefined : (bookings?.length ?? 0)}
          countLabel={`${bookings?.length ?? 0} booking${bookings?.length === 1 ? '' : 's'}`}
          description="Bookings residents have made. Cancelling frees the slot for others."
        >
          {isBookingsLoading ? (
            <EstateListSkeleton />
          ) : !bookings || bookings.length === 0 ? (
            <EmptyState
              bare
              icon={CalendarCheck}
              title="No bookings yet"
              description="Resident bookings for these amenities will show up here."
            />
          ) : (
            <EstateRowList>
              {bookings.map((booking) => (
                <li key={booking.id}>
                  <AmenityBookingRow
                    booking={booking}
                    showHousehold
                    onCancel={() => setCancelling(booking)}
                    isUpdating={cancelBooking.isPending}
                  />
                </li>
              ))}
            </EstateRowList>
          )}
        </EstateListSection>
      </div>

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
