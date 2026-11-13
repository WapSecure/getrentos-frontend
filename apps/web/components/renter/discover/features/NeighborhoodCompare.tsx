'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitCompare, MapPin } from '@sureground/icons';
import {
  commuteSourceNote,
  NEARBY_PLACES_UNAVAILABLE,
  shownTravelMode,
  walkabilityView,
} from '@sureground/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Skeleton,
} from '@sureground/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { NearbyPlace } from '@/types/renter';

interface NeighborhoodCompareProps {
  listingId: string;
  propertyLocation: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  schools: 'Schools',
  transit: 'Transit & commute',
  amenities: 'Amenities',
  food: 'Food & dining',
  healthcare: 'Healthcare',
  shopping: 'Shopping',
  parks: 'Parks & recreation',
  nightlife: 'Nightlife',
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const NeighborhoodCompare = ({ listingId, propertyLocation }: NeighborhoodCompareProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: insights, isLoading } = useQuery({
    queryKey: renterKeys.geoInsights(listingId),
    queryFn: () => unwrap(renterService.getGeoInsights(listingId)),
    enabled: isOpen,
  });

  const categories = Object.entries(insights?.neighborhood ?? {}).filter(
    ([, places]) => places.length > 0
  );

  const walking = walkabilityView(insights?.walkability);

  const placesByCategory = (category: string): NearbyPlace[] =>
    (insights?.neighborhood ?? {})[category] ?? [];

  const formatTravelTime = (seconds?: number): string => {
    if (!seconds) return '—';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <>
      <Button
        variant="link"
        onClick={() => setIsOpen(true)}
        className="gap-1 text-xs font-normal text-muted-foreground hover:text-primary"
      >
        <GitCompare className="w-3 h-3" />
        Area insights
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 sm:max-w-3xl">
          <div className="sticky top-0 bg-card p-4 pr-12 border-b border-border">
            <DialogTitle className="font-semibold text-foreground">Area insights</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Real nearby places and commute times for {propertyLocation}
            </DialogDescription>
          </div>

          <div className="p-6">
            {isLoading && (
              <div role="status" aria-label="Loading area data" className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-16 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 rounded-lg" />
                  ))}
                </div>
              </div>
            )}

            {!isLoading && insights && (
              <>
                {insights.travelTimes && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Commute to {insights.travelTimes.destination}
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {(['driving', 'transit', 'walking'] as const).map((mode) => {
                        const result = shownTravelMode(mode, insights.travelTimes?.modes?.[mode]);
                        if (!result) return null;
                        return (
                          <div key={mode} className="p-3 rounded-lg bg-secondary">
                            <p className="text-xs capitalize text-muted-foreground">{mode}</p>
                            <p className="text-lg font-bold text-foreground">
                              {formatTravelTime(result.durationSeconds)}
                            </p>
                            <p className="text-xs text-muted-foreground">{result.distanceText}</p>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {commuteSourceNote(insights.travelTimes.source)}
                    </p>
                  </div>
                )}

                <div className="mb-6 p-3 rounded-lg bg-secondary">
                  <p className="text-sm font-medium text-foreground">
                    {walking?.heading ?? 'Within walking distance'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {walking?.summary ?? NEARBY_PLACES_UNAVAILABLE}
                  </p>
                </div>

                {categories.length > 0 ? (
                  <div className="space-y-6">
                    {categories.map(([category]) => {
                      const places = placesByCategory(category);
                      if (places.length === 0) return null;
                      return (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-foreground mb-2">
                            {CATEGORY_LABELS[category] ?? category}
                          </h4>
                          <div className="space-y-2">
                            {places.slice(0, 5).map((place, index) => (
                              <div
                                key={`${place.name}-${index}`}
                                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-secondary"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                  <div className="min-w-0">
                                    <p className="text-sm text-foreground">{place.name}</p>
                                    <p className="text-xs text-muted-foreground">{place.address}</p>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right text-xs">
                                  <p className="font-medium text-foreground">
                                    {formatDistance(place.distanceMeters)}
                                  </p>
                                  {place.rating != null && (
                                    <p className="text-muted-foreground">
                                      ★ {place.rating}
                                      {place.userRatingsTotal ? ` (${place.userRatingsTotal})` : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={MapPin}
                    title="No area data available for this property yet."
                    bare
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
