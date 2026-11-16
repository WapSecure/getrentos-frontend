'use client';

import { CalendarCheck } from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import { EstateRow, RowAvatar } from '@/components/estate/shared/EstateListSection';
import type { AmenityBooking } from '@/types/estate';
import { formatClock } from '@sureground/shared';

const formatDateTime = (value: string) =>
  formatClock(new Date(value), { day: 'numeric', month: 'short', minute: '2-digit' });

// A booking that ends the same day reads "17 Nov, 6:00 PM – 7:00 PM", as on mobile.
const formatRange = (startsAt: string, endsAt: string) => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  return `${formatDateTime(startsAt)} – ${sameDay ? formatClock(end) : formatDateTime(endsAt)}`;
};

interface AmenityBookingRowProps {
  booking: AmenityBooking;
  showHousehold?: boolean;
  onCancel?: () => void;
  isUpdating?: boolean;
}

export const AmenityBookingRow = ({
  booking,
  showHousehold,
  onCancel,
  isUpdating,
}: AmenityBookingRowProps) => {
  const isConfirmed = booking.status === 'confirmed';
  return (
    <EstateRow
      leading={<RowAvatar icon={CalendarCheck} tone={isConfirmed ? 'primary' : 'neutral'} />}
      title={
        <>
          <p className="truncate text-sm font-medium text-foreground">{booking.amenityName}</p>
          <Badge variant={isConfirmed ? 'success' : 'neutral'}>
            {isConfirmed ? 'Confirmed' : 'Cancelled'}
          </Badge>
        </>
      }
      meta={
        <>
          {showHousehold && (
            <p className="truncate">
              {booking.unitLabel} · {booking.residentName}
            </p>
          )}
          <p className="tabular-nums">{formatRange(booking.startsAt, booking.endsAt)}</p>
        </>
      }
      actions={
        onCancel && isConfirmed ? (
          <Button variant="outline" size="sm" disabled={isUpdating} onClick={onCancel}>
            Cancel
          </Button>
        ) : undefined
      }
    />
  );
};
