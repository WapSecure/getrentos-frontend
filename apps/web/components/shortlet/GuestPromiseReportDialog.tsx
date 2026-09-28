'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  Field,
  Textarea,
  type PendingUpload,
} from '@getrentos/ui';
import { ShieldCheck } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletKeys } from '@/lib/queryKeys';
import { shortletService } from '@/services/shortletService';
import { formatDeadline, PROBLEM_OPTIONS } from '@/lib/shortlet/guestPromise';
import { SupportContact } from '@/components/shared/support/SupportContact';
import type { GuestPromiseProblem, ShortletBooking } from '@/types/shortlet';

const MAX_PHOTOS = 6;
const MIN_DESCRIPTION = 20;

/**
 * A guest tells us, within 24 hours of check-in, that the stay isn't what they
 * paid for. Photos are only uploaded when they send the report.
 */
export function GuestPromiseReportDialog({
  booking,
  onClose,
  onReported,
}: {
  booking: ShortletBooking;
  onClose: () => void;
  onReported: () => void;
}) {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState<GuestPromiseProblem | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);

  const needsPhoto = problem !== null && problem !== 'NO_ACCESS';

  const send = useMutation({
    mutationFn: async () => {
      const imageKeys: string[] = [];
      for (const item of photos.slice(0, MAX_PHOTOS)) {
        imageKeys.push(
          (await unwrap(shortletService.uploadPromisePhoto(booking.id, item.file))).key
        );
      }
      return unwrap(
        shortletService.reportGuestPromise(booking.id, {
          problemType: problem!,
          description: description.trim(),
          imageKeys: imageKeys.length ? imageKeys : undefined,
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.guestBookings });
      queryClient.invalidateQueries({ queryKey: shortletKeys.disputes });
      onReported();
    },
    onError: (e: Error) => setError(e.message),
  });

  const submit = () => {
    if (!problem) return setError('Choose what went wrong.');
    if (description.trim().length < MIN_DESCRIPTION) {
      return setError(`Describe the problem in at least ${MIN_DESCRIPTION} characters.`);
    }
    if (needsPhoto && photos.length === 0)
      return setError('Add at least one photo showing the problem.');
    setError(null);
    send.mutate();
  };

  const closesAt = booking.guestPromise?.closesAt;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <div className="p-5">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Report a problem with your stay
          </DialogTitle>
          <DialogDescription>
            {booking.propertyTitle}. The GetRentos Guest Promise: we hold the host&rsquo;s payment
            while support checks, and refund you if we uphold your report.
            {closesAt && <> You can report until {formatDeadline(closesAt)}.</>}
          </DialogDescription>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">What went wrong?</legend>
            {PROBLEM_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                  problem === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-secondary/50'
                }`}
              >
                <input
                  type="radio"
                  name="problem"
                  className="mt-1 accent-[var(--primary)]"
                  checked={problem === option.value}
                  onChange={() => setProblem(option.value)}
                />
                <span>
                  <span className="font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <Field label="Tell us what happened">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="e.g. The listing shows a pool and a generator. There is no pool and the generator doesn't work."
            />
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-medium">
              Photos {needsPhoto ? '(at least one)' : '(optional)'}, up to {MAX_PHOTOS}
            </p>
            <DocumentUpload
              value={photos}
              onChange={(next) => setPhotos(next.slice(0, MAX_PHOTOS))}
              accept="image/jpeg,image/png,image/webp"
              multiple
              label=""
              hint="Show what's wrong. Nothing is uploaded until you send the report."
            />
          </div>

          <SupportContact
            lead="Stuck at the gate or need help right now? Talk to us:"
            context={`Guest Promise, booking ${booking.paymentReference ?? booking.id}`}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={send.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={send.isPending}>
              {send.isPending ? 'Sending…' : 'Send report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
