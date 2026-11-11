'use client';

import { useMutation } from '@tanstack/react-query';
import { ReasonDialog, useToast } from '@sureground/ui';
import { Scale } from '@sureground/icons';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import type { ShortletBooking, ShortletDisputeCategory } from '@/types/shortlet';

const CATEGORY_OPTIONS: { value: ShortletDisputeCategory; label: string }[] = [
  { value: 'SERVICE_QUALITY', label: 'Service / listing quality' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'PAYMENT', label: 'Payment / charges' },
  { value: 'CANCELLATION', label: 'Cancellation' },
  { value: 'OTHER', label: 'Other' },
];

export function ShortletOpenDisputeDialog({
  booking,
  onClose,
  onOpened,
}: {
  booking: ShortletBooking;
  onClose: () => void;
  onOpened: () => void;
}) {
  const toast = useToast();

  const open = useMutation({
    mutationFn: (input: {
      title: string;
      category: ShortletDisputeCategory;
      description: string;
    }) => unwrap(shortletService.openDispute(booking.id, input)),
    onSuccess: () => onOpened(),
    onError: (reason: Error) => toast.error(reason.message),
  });

  return (
    <ReasonDialog<ShortletDisputeCategory>
      open
      onOpenChange={(o) => !o && onClose()}
      title="Open a dispute"
      description={`Raise an issue about this stay at ${booking.propertyTitle}. The other party will be notified and admins will review the thread.`}
      subject={{
        label: 'What went wrong?',
        placeholder: 'e.g. The unit was not as described',
        minLength: 3,
        maxLength: 120,
      }}
      categories={{ label: 'Category', options: CATEGORY_OPTIONS, defaultValue: 'SERVICE_QUALITY' }}
      reasonLabel="Details"
      reasonHint="Be specific: include dates, amounts, and anything that helps admins decide."
      reasonPlaceholder="Describe what happened…"
      rows={5}
      minLength={10}
      maxLength={2000}
      showCount
      confirmLabel="Open dispute"
      confirmIcon={<Scale className="h-4 w-4" />}
      loadingText="Opening…"
      onSubmit={({ subject = '', category = 'SERVICE_QUALITY', reason }) =>
        open.mutateAsync({ title: subject, category, description: reason })
      }
    />
  );
}
