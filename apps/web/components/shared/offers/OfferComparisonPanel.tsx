'use client';

import { useQuery } from '@tanstack/react-query';
import { Scale } from 'lucide-react';
import { Alert, Badge, Card, Skeleton, type BadgeVariant } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { sellerOfferKeys } from '@/lib/queryKeys';
import { offerComparisonService } from '@/services/offerComparisonService';
import type { ComparedOffer } from '@/types/offerComparison';

const TURN: Record<ComparedOffer['turn'], { label: string; variant: BadgeVariant }> = {
  new: { label: 'New: your reply', variant: 'info' },
  yours: { label: 'Your turn', variant: 'warning' },
  buyer: { label: "Buyer's turn", variant: 'neutral' },
};

/**
 * "Compare offers": every live offer on each listing side by side (price
 * against asking, financing, deposit, documents, the buyer's record on
 * Sureground, expiry and whose turn it is) with a counter option worked out
 * from the figures. It never says which offer to take. Hidden when there are
 * no live offers, or if it fails: the offers below are the record.
 */
export function OfferComparisonPanel() {
  const { data, isLoading } = useQuery({
    queryKey: sellerOfferKeys.comparison,
    queryFn: () => unwrap(offerComparisonService.compare()),
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card static className="mb-6 space-y-2 p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }
  if (!data?.listings.length) return null;

  return (
    <Card static className="mb-6 space-y-5 p-5" aria-labelledby="offer-comparison-title">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="offer-comparison-title" className="text-sm font-semibold text-foreground">
          Compare offers
        </h2>
      </div>

      {data.listings.map((l) => (
        <section key={l.listingId} aria-label={l.property} className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{l.property}</h3>
            <p className="text-xs text-muted-foreground">
              Asking {l.asking}
              {l.daysListed != null && ` · listed ${l.daysListed} days`}
              {l.market && ` · ${l.market}`}
            </p>
          </div>
          {l.saleInProgress ? (
            <Alert variant="warning">{l.saleInProgress}</Alert>
          ) : (
            <p className="text-sm text-foreground">{l.overview}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {l.offers.map((o) => (
              <div
                key={o.offerId}
                className="space-y-2 rounded-lg border border-border p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {o.label} <span className="text-muted-foreground">· {o.buyerName}</span>
                  </p>
                  {!l.saleInProgress && (
                    <Badge variant={TURN[o.turn].variant}>{TURN[o.turn].label}</Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground">{o.amount}</p>
                <p className="text-muted-foreground">
                  {o.pricePosition}
                  {o.originalAmount && ` First offer ${o.originalAmount}.`}
                  {o.yourCounter && ` You countered ${o.yourCounter}; waiting on the buyer.`}
                </p>
                <ul className="space-y-0.5 text-muted-foreground">
                  <li>
                    <span className="text-foreground">{o.financing}.</span> {o.financingNote}
                  </li>
                  <li>Deposit: {o.deposit ?? 'none stated'}</li>
                  <li>
                    Documents: {o.documents.length ? o.documents.join(', ') : 'none uploaded'}
                  </li>
                  <li>
                    Buyer: {o.buyer.verified ? 'verified' : 'not verified'}, trust score{' '}
                    {o.buyer.trustScore}, {o.buyer.completedPurchases} completed purchase
                    {o.buyer.completedPurchases === 1 ? '' : 's'}, {o.buyer.withdrawnOffersLastYear}{' '}
                    withdrawn offer{o.buyer.withdrawnOffersLastYear === 1 ? '' : 's'} this year
                  </li>
                  <li>{o.expiry}</li>
                </ul>
                <p className="text-foreground">{o.standsOut}</p>
                {o.counterOption && (
                  <div className="rounded-md bg-muted/40 p-2">
                    <p className="font-medium text-foreground">
                      Counter option: {o.counterOption.amount}
                    </p>
                    <p className="text-muted-foreground">{o.counterReasoning}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <p className="text-2xs text-muted-foreground">{data.disclaimer}</p>
    </Card>
  );
}
