'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { Camera, ImageIcon, Loader2, ShieldAlert } from 'lucide-react';
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
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const open = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.openDepositClaim(booking.id, {
          amount: Number(amount),
          reason: reason.trim(),
          imageKeys: imageKeys.length ? imageKeys : undefined,
        })
      ),
    onSuccess: () => onOpened(),
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const keys: string[] = [];
      for (const file of Array.from(files).slice(0, 5 - imageKeys.length)) {
        const res = await unwrap(shortletService.uploadMedia('image', file));
        keys.push(res.key);
      }
      setImageKeys((prev) => [...prev, ...keys]);
      setToast({ message: `${keys.length} evidence photo(s) uploaded.`, variant: 'success' });
    } catch (err) {
      setToast({ message: (err as Error).message, variant: 'error' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const amountNum = Number(amount);
  const canSubmit =
    amountNum > 0 &&
    amountNum <= held &&
    reason.trim().length >= 10 &&
    !open.isPending &&
    !uploading;

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
            <Input
              type="number"
              min={1}
              max={held}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
            <p className="mb-1.5 text-sm font-medium">Evidence photos ({imageKeys.length}/5)</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onUpload(e.target.files)}
            />
            <div className="flex flex-wrap gap-2">
              {imageKeys.map((k) => (
                <div
                  key={k}
                  className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> {k.split('/').pop()?.slice(0, 18)}
                </div>
              ))}
              {imageKeys.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-1.5 h-4 w-4" />
                  )}
                  {uploading ? 'Uploading…' : 'Add photos'}
                </Button>
              )}
            </div>
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
