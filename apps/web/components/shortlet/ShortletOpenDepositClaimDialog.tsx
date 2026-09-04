'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  Field,
  Textarea,
  Toast,
  type ToastVariant,
  type PendingUpload,
} from '@getrentos/ui';
import { ShieldAlert } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { formatCurrency } from '@/lib/format';
import type { ShortletBooking } from '@/types/shortlet';

/**
 * Host files a damage claim against a HELD security deposit. The amount cannot
 * exceed the held deposit and only one claim can be pending per booking.
 */
export function ShortletOpenDepositClaimDialog({
  booking,
  onClose,
  onOpened,
}: {
  booking: ShortletBooking;
  onClose: () => void;
  onOpened: () => void;
}) {
  const held = booking.deposit ?? 0;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState<PendingUpload[]>([]);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const open = useMutation({
    // Evidence stays local until the host confirms — they can preview/zoom/rotate
    // each photo first, and nothing is uploaded to storage until "File claim".
    mutationFn: async () => {
      const keys: string[] = [];
      if (evidence.length) {
        for (const item of evidence.slice(0, 5)) {
          const res = await unwrap(shortletService.uploadMedia('image', item.file));
          keys.push(res.key);
        }
      }
      return unwrap(
        shortletService.openDepositClaim(booking.id, {
          amount: Number(amount),
          reason: reason.trim(),
          imageKeys: keys.length ? keys : undefined,
        })
      );
    },
    onSuccess: () => onOpened(),
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const amountNum = Number(amount);
  const canSubmit =
    amountNum > 0 && amountNum <= held && reason.trim().length >= 10 && !open.isPending;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <div className="p-5">
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" /> Claim against deposit
          </DialogTitle>
          <DialogDescription>
            Claim against the {formatCurrency(held)} deposit held for {booking.propertyTitle} (
            {booking.guestName ?? 'guest'} · {booking.checkIn.slice(0, 10)} →{' '}
            {booking.checkOut.slice(0, 10)}). An admin will adjudicate; the guest keeps any
            remainder.
          </DialogDescription>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
          <Field
            label={`Claim amount (max ${formatCurrency(held)})`}
            hint="This is withheld from the guest's deposit refund if approved."
          >
            <CurrencyInput
              prefix="₦"
              min={1}
              max={held}
              value={amount}
              onValueChange={(v) => setAmount(v === 0 ? '' : String(v))}
              placeholder="e.g. 25000"
            />
          </Field>
          <Field label="Reason" hint="Describe the damage and why the amount is justified.">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Broken kitchen counter and stained sofa during the stay…"
              rows={4}
              maxLength={2000}
            />
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium">Evidence photos (max 5)</p>
            <DocumentUpload
              value={evidence}
              onChange={setEvidence}
              accept="image/*"
              multiple
              label=""
              hint="Preview each photo before filing — nothing is uploaded until you confirm."
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => open.mutate()} disabled={!canSubmit}>
              {open.isPending ? 'Filing claim…' : 'File claim'}
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
