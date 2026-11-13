'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bus,
  Car,
  Dumbbell,
  Footprints,
  MapPin,
  Pill,
  Ruler,
  School,
  ShoppingCart,
  BadgeCheck,
  Stethoscope,
  TrainFront,
  TreePine,
  UtensilsCrossed,
  Wallet,
} from '@sureground/icons';
import {
  commuteSourceNote,
  NEARBY_PLACES_UNAVAILABLE,
  shownTravelMode,
  walkabilityView,
} from '@sureground/shared';
import { PropertyMap, type MapMarker } from '@/components/maps/PropertyMap';
import { Badge } from '@sureground/ui/Badge';
import { Button } from '@sureground/ui/Button';
import { Field } from '@sureground/ui/Field';
import { Skeleton } from '@sureground/ui/Skeleton';
import { renterService } from '@/services/renterService';
import { publicMarketService } from '@/services/publicMarketService';
import { AddressInput } from '@/components/shared/location/AddressInput';
import { unwrap } from '@/lib/apiHelpers';
import { publicMarketKeys, renterKeys } from '@/lib/queryKeys';
import { pluralize } from '@/lib/format';
import { formatPrice } from '@/types/renter';
import type { NearbyPlace, TravelModeResult } from '@/types/renter';

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  schools: { label: 'Schools', icon: School },
  hospitals: { label: 'Healthcare', icon: Stethoscope },
  transit: { label: 'Transit', icon: TrainFront },
  parks: { label: 'Parks & green', icon: TreePine },
  restaurants: { label: 'Dining', icon: UtensilsCrossed },
  supermarkets: { label: 'Groceries', icon: ShoppingCart },
  gyms: { label: 'Fitness', icon: Dumbbell },
  pharmacies: { label: 'Pharmacies', icon: Pill },
};

const MODE_META: Record<
  'driving' | 'transit' | 'walking',
  { label: string; icon: React.ElementType }
> = {
  driving: { label: 'Driving', icon: Car },
  transit: { label: 'Transit', icon: Bus },
  walking: { label: 'Walking', icon: Footprints },
};

const formatDistance = (meters: number): string =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

interface GeoInsightsPanelProps {
  listingId: string;
  title?: string;
  defaultDestination?: string;
  /** `public` reads the open endpoint, for listing pages that don't require sign-in. */
  audience?: 'renter' | 'public';
}

export const GeoInsightsPanel = ({
  listingId,
  title,
  defaultDestination = 'Lagos Island',
  audience = 'renter',
}: GeoInsightsPanelProps) => {
  const [destinationDraft, setDestinationDraft] = useState(defaultDestination);
  const [destination, setDestination] = useState(defaultDestination);

  const {
    data: insights,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      ...(audience === 'public'
        ? publicMarketKeys.geoInsights(listingId)
        : renterKeys.geoInsights(listingId)),
      destination || 'default',
    ],
    queryFn: () =>
      unwrap(
        audience === 'public'
          ? publicMarketService.geoInsights(listingId, destination || undefined)
          : renterService.getGeoInsights(listingId, destination || undefined)
      ),
    // A side panel: its own message below, never the page's error screen.
    throwOnError: false,
  });

  const hasRealData =
    insights &&
    (insights.latitude != null ||
      (insights.neighborhood && Object.keys(insights.neighborhood).length > 0));

  const walking = walkabilityView(insights?.walkability);

  const marker: MapMarker[] =
    insights && insights.latitude != null && insights.longitude != null
      ? [
          {
            id: insights.listingId,
            latitude: insights.latitude,
            longitude: insights.longitude,
            approximate: insights.locationPrecision === 'approximate',
            title: insights.title,
            priceLabel: formatPrice(insights.pricing.price, insights.pricing.rentPeriod ?? 'month'),
            href: undefined,
          },
        ]
      : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-accent p-2 text-primary">
          <MapPin className="h-4 w-4" />
        </div>
        <h2 className="type-heading">Location and neighbourhood</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : isError || !insights || !hasRealData ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {title ? `${title}: map and insights pending` : 'Map and insights pending'}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {isError
              ? 'We could not load insights for this listing right now.'
              : 'Location data for this property is being prepared. Nearby places and commute times will appear here once it is ready.'}
          </p>
        </div>
      ) : (
        <>
          <PropertyMap
            center={{ latitude: insights.latitude ?? 0, longitude: insights.longitude ?? 0 }}
            markers={marker}
            height={320}
            openMarkerId={insights.listingId}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Pricing
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatPrice(insights.pricing.price, insights.pricing.rentPeriod ?? 'month')}
              </p>
              {insights.pricing.pricePerSqm ? (
                <p className="text-xs text-muted-foreground">
                  {formatPrice(
                    insights.pricing.pricePerSqm,
                    insights.pricing.rentPeriod ?? 'month'
                  )}
                  /sqm
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Price per sqm unavailable</p>
              )}
              {(insights.pricing.sizeSqm != null || insights.pricing.bedrooms != null) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {insights.pricing.sizeSqm != null && (
                    <Badge variant="neutral" icon={<Ruler className="h-3 w-3" />}>
                      {insights.pricing.sizeSqm} sqm
                    </Badge>
                  )}
                  {insights.pricing.bedrooms != null && (
                    <Badge variant="neutral">{pluralize(insights.pricing.bedrooms, 'bed')}</Badge>
                  )}
                  {insights.pricing.bathrooms != null && (
                    <Badge variant="neutral">{pluralize(insights.pricing.bathrooms, 'bath')}</Badge>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Footprints className="h-4 w-4" />
                {walking?.heading ?? 'Within walking distance'}
              </div>
              <p className="mt-2 text-sm text-foreground">
                {walking?.summary ?? NEARBY_PLACES_UNAVAILABLE}
              </p>
            </div>
          </div>

          {insights.aiSummary && (
            <div className="rounded-2xl border border-primary/20 bg-accent/40 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <BadgeCheck className="h-4 w-4" />
                Property insight
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{insights.aiSummary}</p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Car className="h-4 w-4" />
              Commute times
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field label="Destination" hint="e.g. an office area or address">
                  <AddressInput
                    kind="any"
                    allowManual
                    value={destinationDraft ? { text: destinationDraft } : null}
                    onChange={(next) => setDestinationDraft(next?.text ?? '')}
                    placeholder="e.g. Lagos Island, Ikeja, or an address"
                  />
                </Field>
              </div>
              <Button
                disabled={!destinationDraft.trim() || destinationDraft.trim() === destination}
                onClick={() => setDestination(destinationDraft.trim())}
              >
                Update times
              </Button>
            </div>

            {insights.travelTimes ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {(Object.keys(MODE_META) as (keyof typeof MODE_META)[]).map((mode) => {
                  const result: TravelModeResult | null = shownTravelMode(
                    mode,
                    insights.travelTimes?.modes?.[mode]
                  );
                  const Icon = MODE_META[mode].icon;
                  return (
                    <div key={mode} className="rounded-xl border border-border bg-secondary/40 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                        {MODE_META[mode].label}
                      </div>
                      {result ? (
                        <>
                          <p className="mt-1 text-base font-semibold text-foreground">
                            {result.durationText}
                          </p>
                          <p className="text-xs text-muted-foreground">{result.distanceText}</p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">Unavailable</p>
                      )}
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground sm:col-span-3">
                  {commuteSourceNote(insights.travelTimes.source)}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Enter a destination to see estimated driving, transit and walking times.
              </p>
            )}
          </div>

          {insights.neighborhood && Object.keys(insights.neighborhood).length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Nearby places (within 2 km)
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.entries(insights.neighborhood)
                  .filter(([, places]) => places.length > 0)
                  .map(([key, places]) => {
                    const meta = CATEGORY_META[key] ?? { label: key, icon: MapPin };
                    const Icon = meta.icon;
                    return (
                      <div key={key} className="rounded-xl border border-border p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Icon className="h-4 w-4 text-primary" />
                          {meta.label}
                        </div>
                        <ul className="mt-2 space-y-1.5">
                          {(places as NearbyPlace[]).slice(0, 3).map((place, index) => (
                            <li
                              key={`${place.name}-${index}`}
                              className="text-xs text-muted-foreground"
                            >
                              <span className="font-medium text-foreground">{place.name}</span>
                              {place.rating != null && (
                                <span className="ml-1 text-warning">
                                  ★ {place.rating.toFixed(1)}
                                </span>
                              )}{' '}
                              • {formatDistance(place.distanceMeters)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
