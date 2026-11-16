'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Star as StarOutline } from '@sureground/icons';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
  useToast,
} from '@sureground/ui';
import { landlordService, type PendingTenantReview } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landlordKeys } from '@/lib/queryKeys';

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`w-3.5 h-3.5 ${n <= rating ? 'fill-primary text-primary' : 'text-border'}`}
      />
    ))}
  </div>
);

/**
 * Lets a landlord or owner review tenants whose tenancy has ended. These reviews are what tenant screening shows
 * other landlords as "reviews from past landlords".
 */
export function TenantReviewsCard() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [target, setTarget] = useState<PendingTenantReview | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const { data } = useQuery({
    queryKey: landlordKeys.tenantReviews,
    queryFn: () => unwrap(landlordService.getTenantReviews()),
  });
  const pending = data?.pending ?? [];
  const written = data?.written ?? [];

  const submit = useMutation({
    mutationFn: (input: { leaseId: string; rating: number; comment?: string }) =>
      unwrap(landlordService.reviewTenant(input)),
    onSuccess: (review) => {
      void queryClient.invalidateQueries({ queryKey: landlordKeys.tenantReviews });
      setTarget(null);
      toast.success(`Review saved. ${review.tenantName} has been told.`);
    },
    onError: (err: Error) => toast.error(err.message || 'We could not save that review.'),
  });

  const open = (p: PendingTenantReview) => {
    setTarget(p);
    setRating(0);
    setComment('');
  };

  if (pending.length === 0 && written.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold text-foreground">Review your tenants</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Rate a tenant once their tenancy ends. Other landlords see these when the tenant applies to
        rent again, and the tenant can read what you wrote.
      </p>

      {pending.length > 0 && (
        <ul className="mt-4 space-y-3">
          {pending.map((p) => (
            <li
              key={p.leaseId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/60 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{p.tenantName}</p>
                <p className="text-xs text-muted-foreground">
                  {p.propertyName} · Tenancy ended {formatDate(p.leaseEnd)}
                </p>
              </div>
              <Button size="sm" variant="primary" onClick={() => open(p)}>
                Review tenant
              </Button>
            </li>
          ))}
        </ul>
      )}

      {written.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-medium text-foreground">Tenants you have reviewed</h3>
          <ul className="mt-3 space-y-3">
            {written.map((r) => (
              <li key={r.id} className="rounded-lg bg-secondary/60 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.tenantName}</p>
                    <p className="text-xs text-muted-foreground">{r.propertyName}</p>
                  </div>
                  <div className="text-right">
                    <Stars rating={r.rating} />
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={target !== null} onOpenChange={(next) => !next && !submit.isPending && setTarget(null)}>
        {target && (
          <DialogContent showClose={!submit.isPending}>
            <DialogTitle className="pr-8 text-xl font-semibold text-foreground mb-2">
              Review {target.tenantName}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-4">
              How was {target.tenantName} as a tenant at {target.propertyName}? They will be able to
              read your review.
            </DialogDescription>

            <div className="flex justify-center gap-2 mb-4" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  aria-pressed={rating === n}
                  className="rounded-md focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                >
                  {(hover || rating) >= n ? (
                    <Star className="w-8 h-8 fill-primary text-primary" />
                  ) : (
                    <StarOutline className="w-8 h-8 text-muted-foreground/50" />
                  )}
                </button>
              ))}
            </div>

            <Field label="Your review (optional)" className="mb-4">
              <Textarea
                placeholder="Rent on time? Looked after the home? Easy to deal with?"
                value={comment}
                maxLength={1000}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </Field>

            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setTarget(null)}
                disabled={submit.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={rating === 0 || submit.isPending}
                isLoading={submit.isPending}
                onClick={() =>
                  submit.mutate({
                    leaseId: target.leaseId,
                    rating,
                    comment: comment.trim() || undefined,
                  })
                }
              >
                Submit review
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
