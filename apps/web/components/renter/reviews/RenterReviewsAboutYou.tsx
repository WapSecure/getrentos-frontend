'use client';

import { useQuery } from '@tanstack/react-query';
import { Star } from '@sureground/icons';
import { EmptyState } from '@sureground/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { renterKeys } from '@/lib/queryKeys';

export function RenterReviewsAboutYou() {
  const { data, isLoading } = useQuery({
    queryKey: renterKeys.reviewsReceived,
    queryFn: () => unwrap(renterService.getReceivedReviews({ page: 1, pageSize: 20 })),
  });
  const reviews = (data?.items ?? []).filter((r) => r.category === 'TENANT');

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">What landlords say about you</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Landlords can review you once you have moved out. Landlords you apply to later see these
        reviews.
      </p>
      {isLoading ? null : reviews.length === 0 ? (
        <EmptyState icon={Star} title="No landlord reviews yet" className="mt-4" />
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg bg-secondary/60 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {r.reviewerName ?? 'Your landlord'}
                  </p>
                  {r.propertyTitle && (
                    <p className="text-xs text-muted-foreground">{r.propertyTitle}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-primary text-primary' : 'text-border'}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                </div>
              </div>
              {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
