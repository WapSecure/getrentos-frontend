'use client';

import { useQuery } from '@tanstack/react-query';
import { Star, MessageCircle } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
      />
    ))}
  </div>
);

export default function RealtorReviewsPage() {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: realtorKeys.reviews,
    queryFn: () => unwrap(realtorService.getReviews()),
  });

  const overallRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  if (isLoading) {
    return <div className="p-10 text-center text-muted-foreground">Loading reviews…</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews & Reputation</h1>
        <p className="text-muted-foreground mt-1">
          See how clients and leads rate their experience with you
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-bold text-foreground">{overallRating.toFixed(1)}</p>
          <StarRow rating={Math.round(overallRating)} />
          <p className="text-xs text-muted-foreground mt-2">
            Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 space-y-4">
          {distribution.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-16 shrink-0 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                {star}
              </span>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-foreground w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <MessageCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No reviews yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Reviews from clients and buyers will appear here once submitted.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                    {getInitials(review.author)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {review.author}
                      {review.category ? (
                        <span className="text-xs text-gray-400 font-normal">
                          {' '}
                          · {review.category}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <StarRow rating={review.rating} />
                  <p className="text-xs text-gray-400 mt-1">{formatDate(review.date)}</p>
                </div>
              </div>
              {review.comment ? (
                <p className="text-sm text-muted-foreground mt-3">{review.comment}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </>
  );
}
