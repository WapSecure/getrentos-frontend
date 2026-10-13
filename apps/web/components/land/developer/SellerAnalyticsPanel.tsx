'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState } from '@getrentos/ui';
import { BarChart3, Bookmark, CalendarCheck, Eye, Handshake, TrendingUp } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import type { LandListingAnalytics, LandSellerAnalytics } from '@/types/landDeveloper';
import { errorMessage } from './feedback';

const Metric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) => (
  <div className="rounded-xl border border-border bg-secondary/30 p-3">
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </p>
    <p className="mt-1 text-lg font-semibold text-foreground">{value.toLocaleString('en-NG')}</p>
  </div>
);

const ListingCard = ({ listing }: { listing: LandListingAnalytics }) => (
  <Card static className="p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="text-lg font-semibold text-foreground">
          {formatCurrency(listing.askingPrice)}
        </p>
        <p className="text-sm text-muted-foreground">
          {listing.publishedAt
            ? `Listed ${formatDate(listing.publishedAt)}${listing.daysOnMarket !== null ? ` · ${listing.daysOnMarket} days on market` : ''}`
            : 'Not published'}
        </p>
      </div>
      <Badge variant={listing.status === 'PUBLISHED' ? 'success' : 'neutral'}>
        {listing.status.toLowerCase().replace(/_/g, ' ')}
      </Badge>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric icon={Eye} label="Views" value={listing.views} />
      <Metric icon={Bookmark} label="Saves" value={listing.saves} />
      <Metric icon={CalendarCheck} label="Viewings" value={listing.viewings} />
      <Metric icon={Handshake} label="Offers" value={listing.totalOffers} />
    </div>
    {listing.latestOffer && (
      <p className="mt-4 text-sm text-muted-foreground">
        Latest offer:{' '}
        <span className="font-medium text-foreground">
          {formatCurrency(listing.latestOffer.amount)}
        </span>{' '}
        ({listing.latestOffer.vsAskingPercent > 0 ? '+' : ''}
        {listing.latestOffer.vsAskingPercent}% vs asking, {listing.latestOffer.status.toLowerCase()}
        ) on {formatDate(listing.latestOffer.createdAt)}.
      </p>
    )}
  </Card>
);

const MarketPosition = ({ market }: { market: NonNullable<LandSellerAnalytics['market']> }) => (
  <Card static className="p-5">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <TrendingUp className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">Market position</h2>
        <p className="text-sm text-muted-foreground">
          Against {market.sampleSize} verified listing{market.sampleSize === 1 ? '' : 's'} in{' '}
          {market.area}.
        </p>
      </div>
    </div>
    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
      <div>
        <dt className="text-xs text-muted-foreground">Your price per sqm</dt>
        <dd className="text-lg font-semibold text-foreground">
          {market.subjectPricePerSqm !== undefined
            ? formatCurrency(market.subjectPricePerSqm)
            : '—'}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Market median per sqm</dt>
        <dd className="text-lg font-semibold text-foreground">
          {market.marketMedianPricePerSqm !== undefined
            ? formatCurrency(market.marketMedianPricePerSqm)
            : '—'}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Percentile</dt>
        <dd className="text-lg font-semibold text-foreground">
          {market.percentile !== undefined ? `${Math.round(market.percentile)}th` : '—'}
        </dd>
      </div>
    </dl>
    {market.pricingHint && (
      <p className="mt-4 rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground">
        {market.pricingHint}
      </p>
    )}
  </Card>
);

/** How the property's sale listings are doing, and how its price sits against the market. */
export const SellerAnalyticsPanel = ({ propertyId }: { propertyId: string }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: landDeveloperKeys.analytics(propertyId),
    queryFn: () => unwrap(landDeveloperService.getSellerAnalytics(propertyId)),
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }
  if (isError || !data) {
    return (
      <Card static className="p-5 text-sm text-destructive">
        {errorMessage(error, 'Analytics could not be loaded.')}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.market && <MarketPosition market={data.market} />}
      {data.listings.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No sale listing yet"
          description="Once this parcel is listed for sale, views, saves, viewings and offers show here."
        />
      ) : (
        data.listings.map((listing) => <ListingCard key={listing.listingId} listing={listing} />)
      )}
    </div>
  );
};
