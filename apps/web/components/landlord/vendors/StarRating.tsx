'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  /** Whole or fractional stars to show filled. */
  value: number;
  /** When given, the stars become buttons that call this with 1-5. */
  onRate?: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
}

/** Five stars: a read-out when `onRate` is absent, a picker when it is given. */
export const StarRating = ({
  value,
  onRate,
  disabled = false,
  size = 'sm',
  label = 'Rating',
}: StarRatingProps) => {
  const iconClass = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div
      className="inline-flex items-center gap-0.5"
      role={onRate ? 'group' : 'img'}
      aria-label={`${label}: ${value.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star - 0.25;
        const icon = (
          <Star
            className={`${iconClass} ${filled ? 'fill-primary text-primary' : 'text-muted-foreground/40'}`}
            aria-hidden="true"
          />
        );
        return onRate ? (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onRate(star)}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            className="rounded p-0.5 hover:scale-110 transition-transform disabled:cursor-not-allowed disabled:opacity-60"
          >
            {icon}
          </button>
        ) : (
          <span key={star}>{icon}</span>
        );
      })}
    </div>
  );
};
