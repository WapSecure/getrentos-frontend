'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { Scale } from 'lucide-react';
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
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ShortletDisputeCategory>('SERVICE_QUALITY');
  const [description, setDescription] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const open = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.openDispute(booking.id, {
          title: title.trim(),
          category,
          description: description.trim(),
        })
      ),
    onSuccess: () => onOpened(),
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const canSubmit = title.trim().length >= 3 && description.trim().length >= 10 && !open.isPending;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <div className="p-5">
          <DialogTitle>Open a dispute</DialogTitle>
          <DialogDescription>
            Raise an issue about this stay at {booking.propertyTitle}. The other party will be
            notified and admins will review the thread.
          </DialogDescription>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
          <Field label="What went wrong?">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The unit was not as described"
              maxLength={120}
            />
          </Field>
          <Field label="Category">
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ShortletDisputeCategory)}
              options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
            />
          </Field>
          <Field
            label="Details"
            hint="Be specific — include dates, amounts, and anything that helps admins decide."
          >
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened…"
              rows={5}
              maxLength={2000}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => open.mutate()} disabled={!canSubmit}>
              <Scale className="mr-1.5 h-4 w-4" />
              {open.isPending ? 'Opening…' : 'Open dispute'}
            </Button>
          </div>
        </div>
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
