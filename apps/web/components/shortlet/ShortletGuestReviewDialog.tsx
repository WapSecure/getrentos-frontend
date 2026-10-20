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
  Textarea,
  useToast,
} from '@getrentos/ui';
import { Star } from 'lucide-react';
import { cn } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import type { ShortletBooking } from '@/types/shortlet';

const RATINGS = [1, 2, 3, 4, 5];

/** Host rates a guest after a completed stay (one review per booking). */
export function ShortletGuestReviewDialog({
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
  const toast = useToast();

  const submit = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.createGuestReview(booking.id, {
          rating,
          comment: comment.trim() || undefined,
        })
      ),
    onSuccess: () => onSubmitted(),
    onError: (reason: Error) => toast.error(reason.message),
  });

  const canSubmit = rating >= 1;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0">
        <div className="p-5">
          <DialogTitle>Review your guest</DialogTitle>
          <DialogDescription>
            How was {booking.guestName ?? 'this guest'} as a guest?
          </DialogDescription>
        </div>
        <div className="space-y-4 border-t border-border p-5">
          <div>
            <p className="mb-2 text-sm font-medium">Guest rating</p>
            <div className="flex gap-1">
              {RATINGS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  aria-pressed={rating === n}
                  className="text-3xl transition"
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors',
                      n <= (hover || rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <Field label="Comment" optionalLabel="(optional)">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How did the guest treat the place? Would you host them again?"
              rows={4}
              maxLength={1000}
              showCount
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => submit.mutate()}
              isLoading={submit.isPending}
              loadingText="Submitting…"
              disabled={!canSubmit}
            >
              Submit review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
