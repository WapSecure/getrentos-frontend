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
  Sparkles,
  Stethoscope,
  TrainFront,
  TreePine,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { PropertyMap, type MapMarker } from '@/components/maps/PropertyMap';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
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
}

export const GeoInsightsPanel = ({
  listingId,
  title,
  defaultDestination = 'Lagos Island',
}: GeoInsightsPanelProps) => {
  const [destinationDraft, setDestinationDraft] = useState(defaultDestination);
  const [destination, setDestination] = useState(defaultDestination);

  const {
    data: insights,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [...renterKeys.geoInsights(listingId), destination || 'default'],
    queryFn: () => unwrap(renterService.getGeoInsights(listingId, destination || undefined)),
  });

  const hasRealData =
    insights &&
    (insights.latitude != null ||
      (insights.neighborhood && Object.keys(insights.neighborhood).length > 0));

  const marker: MapMarker[] =
    insights && insights.latitude != null && insights.longitude != null
      ? [
          {
            id: insights.listingId,
            latitude: insights.latitude,
            longitude: insights.longitude,
            title: insights.title,
            priceLabel: formatPrice(insights.pricing.price, 'month'),
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
        <h2 className="type-heading">Location & Insights</h2>
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
            {title ? `${title} — map & insights pending` : 'Map & insights pending'}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {isError
              ? 'We could not load insights for this listing right now.'
              : 'Location data for this property is being prepared. Real neighborhood data and commute times will appear here once it is ready.'}
          </p>
        </div>
      ) : (
        <>
          {/* Map */}
          <PropertyMap
            center={{ latitude: insights.latitude ?? 0, longitude: insights.longitude ?? 0 }}
            markers={marker}
            height={320}
            openMarkerId={insights.listingId}
          />

          {/* Pricing + walkability */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Pricing
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatPrice(insights.pricing.price, 'month')}
              </p>
              {insights.pricing.pricePerSqm ? (
                <p className="text-xs text-muted-foreground">
                  {formatPrice(insights.pricing.pricePerSqm, 'month')}/sqm
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
                    <Badge variant="neutral">{insights.pricing.bedrooms} beds</Badge>
                  )}
                  {insights.pricing.bathrooms != null && (
                    <Badge variant="neutral">{insights.pricing.bathrooms} baths</Badge>
                  )}
                </div>
              )}
            </div>

            {insights.walkability && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Footprints className="h-4 w-4" />
                  Walkability
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary">
                    {insights.walkability.score}
                  </span>
                  <Badge variant="success">{insights.walkability.label}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{insights.walkability.summary}</p>
              </div>
            )}
          </div>

          {/* AI summary */}
          {insights.aiSummary && (
            <div className="rounded-2xl border border-primary/20 bg-accent/40 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                AI property insight
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{insights.aiSummary}</p>
            </div>
          )}

          {/* Travel times */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Car className="h-4 w-4" />
              Commute times
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field label="Destination" hint="e.g. an office area or address">
                  <Input
                    value={destinationDraft}
                    onChange={(e) => setDestinationDraft(e.target.value)}
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
                  const result: TravelModeResult | null | undefined =
                    insights.travelTimes?.modes?.[mode];
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
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Enter a destination to see real drive / transit / walk times.
              </p>
            )}
          </div>

          {/* Neighborhood */}
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
                          {(places as NearbyPlace[]).slice(0, 3).map((place) => (
                            <li key={place.name} className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{place.name}</span>
                              {place.rating != null && (
                                <span className="ml-1 text-amber-600 dark:text-amber-400">
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
