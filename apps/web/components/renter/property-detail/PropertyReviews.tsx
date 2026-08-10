import { Star } from 'lucide-react';
import type { PropertyReview } from '@/types/renter';

interface PropertyReviewsProps {
  reviews: PropertyReview[];
}

export const PropertyReviews = ({ reviews }: PropertyReviewsProps) => {
  if (reviews.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Renter Reviews ({reviews.length})
      </h3>
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="p-3 rounded-lg bg-secondary">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{review.author}</span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                <span className="text-xs text-muted-foreground">{review.rating}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">{review.comment}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{review.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
