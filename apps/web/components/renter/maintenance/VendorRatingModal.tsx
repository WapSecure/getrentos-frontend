'use client';

import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Button, IconButton } from '@getrentos/ui';

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
    isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-rating-title"
          className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="p-4 border-b border-border flex justify-between items-center">
            <div>
              <h3 id="vendor-rating-title" className="font-semibold text-foreground">
                Rate vendor
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">How was your experience?</p>
            </div>
            <IconButton
              label="Close rating form"
              icon={<X />}
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            />
          </div>

          <div className="p-6 space-y-4">
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
                    className="rounded-lg p-1 transition-colors hover:bg-secondary"
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
        </div>
      </div>
    )
  );
};
