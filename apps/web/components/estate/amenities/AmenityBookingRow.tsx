'use client';

import { CalendarCheck } from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import { EstateRow, RowAvatar } from '@/components/estate/shared/EstateListSection';
import type { AmenityBooking } from '@/types/estate';

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

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
          <p className="tabular-nums">
            {formatDateTime(booking.startsAt)} – {formatDateTime(booking.endsAt)}
          </p>
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
