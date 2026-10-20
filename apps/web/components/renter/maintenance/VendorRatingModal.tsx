'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';

interface VendorRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => Promise<void>;
}

export const VendorRatingModal = ({ isOpen, onClose, onSubmit }: VendorRatingModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating > 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(rating);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent>
        <DialogTitle className="pr-8 font-semibold text-foreground">Rate vendor</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          How was your experience?
        </DialogDescription>

        <div className="mt-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Rate the quality of service provided
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star === 1 ? '' : 's'}`}
                  aria-pressed={rating === star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="rounded-lg p-1 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star
                    className={`w-10 h-10 ${
                      (hoverRating || rating) >= star
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground/50'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && <p className="mt-2 text-sm text-muted-foreground">{rating} of 5</p>}
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              fullWidth
              onClick={() => void handleSubmit()}
              disabled={rating === 0}
              isLoading={isSubmitting}
              loadingText="Saving…"
            >
              Submit rating
            </Button>
            <Button variant="ghost" fullWidth onClick={onClose} disabled={isSubmitting}>
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
