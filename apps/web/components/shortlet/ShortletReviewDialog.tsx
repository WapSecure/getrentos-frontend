'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { Star } from 'lucide-react';
import { cn } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import type { ShortletBooking } from '@/types/shortlet';

const RATINGS = [1, 2, 3, 4, 5];

export function ShortletReviewDialog({
  booking,
  onClose,
  onSubmitted,
}: {
  booking: ShortletBooking;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.createReview(booking.id, {
          rating,
          comment: comment.trim() || undefined,
        })
      ),
    onSuccess: () => onSubmitted(),
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const canSubmit = rating >= 1 && !submit.isPending;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="p-5">
          <DialogTitle>Review your stay</DialogTitle>
          <DialogDescription>How was your stay at {booking.propertyTitle}?</DialogDescription>
        </div>
        <div className="space-y-4 border-t border-border p-5">
          <div>
            <p className="mb-2 text-sm font-medium">Your rating</p>
            <div className="flex gap-1">
              {RATINGS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  className="text-3xl transition"
                >
                  <Star
                    className={cn(
                      'h-8 w-8',
                      (hover || rating) >= n
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/40'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Comment (optional)</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What made your stay special?"
              rows={3}
              maxLength={1000}
            />
          </div>
          <Button className="w-full" disabled={!canSubmit} onClick={() => submit.mutate()}>
            {submit.isPending ? 'Submitting…' : 'Submit review'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Your review helps other guests choose with confidence.
          </p>
        </div>
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
