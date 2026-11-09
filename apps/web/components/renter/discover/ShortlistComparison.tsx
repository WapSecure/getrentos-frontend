'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Badge, Skeleton, type BadgeVariant } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { renterService } from '@/services/renterService';
import type { ComparedHome } from '@/types/rentDecision';

const CHECK: Record<ComparedHome['listingCheck'], { label: string; variant: BadgeVariant }> = {
  looks_good: { label: 'Looks good', variant: 'success' },
  check_carefully: { label: 'Check carefully', variant: 'warning' },
  be_cautious: { label: 'Be cautious', variant: 'danger' },
};

/**
 * The trade-offs between the homes being compared: rent and where it sits,
 * against similar homes, cash to move in and each home's listing check. It
 * never picks for the renter. Hidden if it fails: the table above still works.
 */
export function ShortlistComparison({ listingIds }: { listingIds: string[] }) {
  const { data, isLoading } = useQuery({
    queryKey: renterKeys.shortlistComparison(listingIds),
    queryFn: () => unwrap(renterService.compareShortlist(listingIds)),
    enabled: listingIds.length >= 2,
    staleTime: 10 * 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <section
      className="mt-6 space-y-3 border-t border-border pt-5"
      aria-labelledby="shortlist-comparison-title"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 id="shortlist-comparison-title" className="text-sm font-semibold text-foreground">
          What&apos;s different
        </h3>
      </div>
      <p className="text-sm text-foreground">{data.overview}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.homes.map((h) => (
          <div
            key={h.listingId}
            className="space-y-1.5 rounded-lg border border-border p-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                <span className="text-muted-foreground">{h.label} · </span>
                {h.title}
              </p>
              <Badge variant={CHECK[h.listingCheck].variant}>{CHECK[h.listingCheck].label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {h.rentPerYear} a year · {h.pricePosition}
              {h.vsSimilar && ` ${h.vsSimilar}`}
            </p>
            <p className="text-muted-foreground">Cash to move in: {h.moveInCash}</p>
            {h.warnings.map((w) => (
              <p key={w} className="text-destructive">
                {w}
              </p>
            ))}
            <p className="text-foreground">{h.standsOut}</p>
          </div>
        ))}
      </div>
      <p className="text-2xs text-muted-foreground">{data.disclaimer}</p>
    </section>
  );
}
