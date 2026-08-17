'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GitCompare, MapPin, X, Loader2 } from 'lucide-react';
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
  transit: 'Transit & Commute',
  amenities: 'Amenities',
  food: 'Food & Dining',
  healthcare: 'Healthcare',
  shopping: 'Shopping',
  parks: 'Parks & Recreation',
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
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
      >
        <GitCompare className="w-3 h-3" />
        Area insights
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-card p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Area Insights</h3>
                <p className="text-xs text-gray-500">
                  Real nearby places and commute times for {propertyLocation}
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading area data…</span>
                </div>
              )}

              {!isLoading && insights && (
                <>
                  {/* Commute times */}
                  {insights.travelTimes && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-foreground mb-3">
                        Commute to {insights.travelTimes.destination}
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {(['driving', 'transit', 'walking'] as const).map((mode) => {
                          const result = insights.travelTimes?.modes?.[mode];
                          if (!result) return null;
                          return (
                            <div key={mode} className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                              <p className="text-xs capitalize text-gray-500">{mode}</p>
                              <p className="text-lg font-bold text-foreground">
                                {formatTravelTime(result.durationSeconds)}
                              </p>
                              <p className="text-xs text-gray-500">{result.distanceText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Walkability */}
                  {insights.walkability && (
                    <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Walkability</p>
                        <span className="text-sm font-semibold text-primary">
                          {insights.walkability.score}/100 · {insights.walkability.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insights.walkability.summary}
                      </p>
                    </div>
                  )}

                  {/* Nearby places by category */}
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
                                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5"
                                >
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    <div>
                                      <p className="text-sm text-foreground">{place.name}</p>
                                      <p className="text-xs text-gray-500">{place.address}</p>
                                    </div>
                                  </div>
                                  <div className="text-right text-xs">
                                    <p className="font-medium text-foreground">
                                      {formatDistance(place.distanceMeters)}
                                    </p>
                                    {place.rating != null && (
                                      <p className="text-gray-500">
                                        ★ {place.rating}
                                        {place.userRatingsTotal
                                          ? ` (${place.userRatingsTotal})`
                                          : ''}
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
                    <div className="text-center py-12">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No area data available for this property yet.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
