'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, ShieldCheck, ShieldQuestion, Sparkles } from '@sureground/icons';
import { Card, Skeleton } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { renterService } from '@/services/renterService';
import type { ListingCheckLevel } from '@/types/listingCheck';

const LEVEL_STYLE: Record<
  ListingCheckLevel,
  { icon: typeof ShieldCheck; tone: string; ring: string }
> = {
  looks_good: { icon: ShieldCheck, tone: 'text-success', ring: 'border-success/30 bg-success/5' },
  check_carefully: {
    icon: ShieldQuestion,
    tone: 'text-warning',
    ring: 'border-warning/30 bg-warning/5',
  },
  be_cautious: {
    icon: ShieldAlert,
    tone: 'text-destructive',
    ring: 'border-destructive/30 bg-destructive/5',
  },
};

// Level and figures come from Sureground data by rule; never a verdict on the landlord.
export function ListingCheckCard({ listingId }: { listingId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: renterKeys.listingCheck(listingId),
    queryFn: () => unwrap(renterService.checkListing(listingId)),
    staleTime: 10 * 60_000,
  });

  if (isLoading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }
  if (isError || !data) return null;

  const style = LEVEL_STYLE[data.level];
  const Icon = style.icon;
  const p = data.facts.price;

  return (
    <Card className={`p-4 space-y-3 border ${style.ring}`} aria-labelledby="listing-check-title">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${style.tone}`} aria-hidden="true" />
        <h3 id="listing-check-title" className="text-sm font-semibold text-foreground">
          Should I rent this?
        </h3>
      </div>
      <p className={`text-sm font-medium ${style.tone}`}>{data.headline}</p>
      <p className="text-sm text-foreground">{data.summary}</p>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-secondary/40 p-3 text-xs">
        <dt className="text-muted-foreground">Price</dt>
        <dd className="text-right text-foreground">
          {p.amount} {p.period}
        </dd>
        <dt className="text-muted-foreground">Similar homes</dt>
        <dd className="text-right text-foreground">
          {p.median ? `typical ${p.median} (${p.comparables})` : 'not enough to compare'}
        </dd>
        <dt className="text-muted-foreground">Listing</dt>
        <dd className="text-right text-foreground">
          {data.facts.listingVerified ? 'Verified' : 'Not verified yet'}
        </dd>
        <dt className="text-muted-foreground">Landlord</dt>
        <dd className="text-right text-foreground">
          {data.facts.landlord.verified
            ? `Verified · trust ${data.facts.landlord.trustScore}`
            : 'Not verified yet'}
        </dd>
      </dl>

      {data.facts.warnings.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Worth asking about</p>
          <ul className="list-disc pl-4 space-y-0.5 text-xs text-muted-foreground">
            {data.facts.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Before you pay</p>
        <ol className="list-decimal pl-4 space-y-0.5 text-sm text-foreground">
          {data.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>

      <p className="flex items-center gap-1 text-2xs text-muted-foreground">
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        Figures from Sureground listings
        {data.source === 'ai' ? '; wording is automated' : ''}. A guide, not a guarantee.
      </p>
    </Card>
  );
}
