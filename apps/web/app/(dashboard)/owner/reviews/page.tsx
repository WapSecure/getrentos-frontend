'use client';

import { useQuery } from '@tanstack/react-query';
import { Star, MessageCircle, ShieldCheck, Clock } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/format';
import { ownerService, type OwnerReview } from '@/services/ownerService';
import { ownerKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? 'fill-primary text-primary' : 'text-gray-200 dark:text-gray-700'}`}
      />
    ))}
  </div>
);

const categoryIcon: Record<string, React.ElementType> = {
  communication: MessageCircle,
  transparency: ShieldCheck,
  responsiveness: Clock,
};

export default function OwnerReviewsPage() {
  const { data: reviews = [] } = useQuery({
    queryKey: ownerKeys.reviews,
    queryFn: () => unwrap(ownerService.listReviews()),
  });

  const { data: summary } = useQuery({
    queryKey: ownerKeys.reviewSummary,
    queryFn: () => unwrap(ownerService.getRatingSummary()),
  });

  const overallRating = summary?.averageRating ?? 0;
  const categories = (summary?.categories ?? []).map((c) => ({
    label: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    icon: categoryIcon[c.category.toLowerCase()] ?? MessageCircle,
    value: c.average,
  }));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews & Reputation</h1>
        <p className="text-muted-foreground mt-1">See how buyers rate their experience with you</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-bold text-foreground">{overallRating.toFixed(1)}</p>
          <StarRow rating={Math.round(overallRating)} />
          <p className="text-xs text-muted-foreground mt-2">
            Based on {summary?.reviewCount ?? reviews.length} review
            {summary?.reviewCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 space-y-4">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No category ratings yet
            </p>
          ) : (
            categories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.label} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-muted-foreground w-36 shrink-0">
                    {category.label}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(category.value / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-8 text-right">
                    {category.value.toFixed(1)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review: OwnerReview) => (
          <div key={review.id} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                  {getInitials(review.author)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{review.author}</p>
                  <p className="text-xs text-muted-foreground">{review.category}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <StarRow rating={review.rating} />
                <p className="text-xs text-gray-400 mt-1">{formatDate(review.date)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{review.comment}</p>
          </div>
        ))}
      </div>
    </>
  );
}
