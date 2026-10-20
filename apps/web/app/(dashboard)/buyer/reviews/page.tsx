'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Star, PenLine } from 'lucide-react';
import { Button, Card, ListSkeleton, Pagination, QueryState } from '@getrentos/ui';
import { getInitials, formatDate } from '@/lib/format';
import { ROUTES } from '@/lib/constants/auth';
import { buyerService, type BuyerReview } from '@/services/buyerService';
import { buyerKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';

const StarRow = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'} ${i < rating ? 'fill-primary text-primary' : 'text-border'}`}
      />
    ))}
  </div>
);

export default function BuyerReviewsPage() {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const reviewsQuery = useQuery({
    queryKey: [...buyerKeys.reviews, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(buyerService.listReviews({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const reviewsData = reviewsQuery.data;
  const reviews = reviewsData?.items ?? [];
  const total = reviewsData?.total ?? 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-muted-foreground mt-1">Reviews you&apos;ve left for property owners</p>
      </div>

      <div className="mb-6 bg-accent border border-primary/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent">
            <PenLine className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Recently completed a purchase?</p>
            <p className="text-xs text-muted-foreground">
              Leave a review to help other buyers on GetRentos.
            </p>
          </div>
        </div>
        <Button href={ROUTES.BUYER_TRANSACTIONS} variant="outline" size="sm">
          View Transactions
        </Button>
      </div>

      <QueryState
        isLoading={reviewsQuery.isLoading}
        isError={reviewsQuery.isError && !reviewsData}
        onRetry={() => void reviewsQuery.refetch()}
        isRetrying={reviewsQuery.isFetching}
        isEmpty={reviews.length === 0}
        empty={{ icon: Star, title: "You haven't left any reviews yet" }}
        scope="page"
        loading={<ListSkeleton variant="cards" rows={4} />}
      >
        <div className="space-y-4">
          {reviews.map((review: BuyerReview) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                    {getInitials(review.author)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.author}</p>
                    <p className="text-xs text-muted-foreground">{review.category}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <StarRow rating={review.rating} />
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(review.date)}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{review.comment}</p>
            </Card>
          ))}
        </div>
      </QueryState>

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
