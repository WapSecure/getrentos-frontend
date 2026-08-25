'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Star, MessageCircle, Home, Clock } from 'lucide-react';
import { Pagination } from '@getrentos/ui';
import { getInitials, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService, type TenantReview } from '@/services/landlordService';

const PAGE_SIZE = 10;

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

export default function LandlordReviewsPage() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: [...landlordKeys.reviews, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(landlordService.listReviews({ page, pageSize: PAGE_SIZE })),
  });
  const reviews = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: summary } = useQuery({
    queryKey: landlordKeys.reviewSummary,
    queryFn: () => unwrap(landlordService.getReviewSummary()),
  });

  const overallRating = summary?.averageRating ?? 0;
  const categories = [
    { label: 'Communication', icon: MessageCircle, value: summary?.averageCommunication ?? 0 },
    {
      label: 'Property Condition',
      icon: Home,
      value: summary?.averagePropertyCondition ?? 0,
    },
    { label: 'Responsiveness', icon: Clock, value: summary?.averageResponsiveness ?? 0 },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews & Reputation</h1>
        <p className="text-muted-foreground mt-1">See how tenants rate their experience with you</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-bold text-foreground">{overallRating.toFixed(1)}</p>
          <StarRow rating={Math.round(overallRating)} />
          <p className="text-xs text-muted-foreground mt-2">
            Based on {summary?.reviewCount ?? total} review
            {summary?.reviewCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 space-y-4">
          {categories.map((category) => (
            <div key={category.label} className="flex items-center gap-3">
              <category.icon className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-muted-foreground w-36 shrink-0">{category.label}</span>
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
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review: TenantReview) => (
          <div key={review.id} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                  {getInitials(review.tenantName)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{review.tenantName}</p>
                  <p className="text-xs text-muted-foreground">{review.propertyName}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <StarRow rating={review.rating} />
                <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{review.comment}</p>
          </div>
        ))}
      </div>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}
