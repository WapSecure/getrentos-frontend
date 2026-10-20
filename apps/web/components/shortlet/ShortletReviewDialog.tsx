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
  const toast = useToast();

  const submit = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.createReview(booking.id, {
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
                  aria-pressed={rating === n}
                  className="text-3xl transition"
                >
                  <Star
                    className={cn(
                      'h-8 w-8',
                      (hover || rating) >= n
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground/40'
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
              placeholder="What made your stay special?"
              rows={3}
              maxLength={1000}
              showCount
            />
          </Field>
          <Button
            className="w-full"
            disabled={!canSubmit}
            isLoading={submit.isPending}
            loadingText="Submitting…"
            onClick={() => submit.mutate()}
          >
            Submit review
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Your review helps other guests choose with confidence.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
