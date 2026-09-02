'use client';

import { Badge, Button } from '@getrentos/ui';
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
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {booking.amenityName}
          {showHousehold ? ` — ${booking.unitLabel} (${booking.residentName})` : ''}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDateTime(booking.startsAt)} – {formatDateTime(booking.endsAt)}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={booking.status === 'confirmed' ? 'success' : 'neutral'}>
          {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
        </Badge>
        {onCancel && booking.status === 'confirmed' && (
          <Button variant="outline" size="sm" disabled={isUpdating} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
