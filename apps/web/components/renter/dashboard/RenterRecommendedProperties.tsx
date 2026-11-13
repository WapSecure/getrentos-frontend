'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Star } from '@sureground/icons';
import { Button, ListingCard, ListingCardAction } from '@sureground/ui';
import { ROUTES, buildRoute } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export const RenterRecommendedProperties = () => {
  const queryClient = useQueryClient();

  const { data: listings = [] } = useQuery({
    queryKey: renterKeys.recommendations,
    queryFn: () => unwrap(renterService.getRecommendations()),
  });
  const recommendedProperties = listings.slice(0, 3);

  const { data: savedListingsData } = useQuery({
    queryKey: [...renterKeys.savedListings, { page: 1, pageSize: 20 }],
    queryFn: () => unwrap(renterService.listSavedListings({ page: 1, pageSize: 20 })),
  });
  const savedListings = savedListingsData?.items ?? [];
  const savedIds = savedListings.map((p) => p.id);
  // Optimistic until the request settles, so a failed save falls back to the server's list.
  const [pendingSaved, setPendingSaved] = useState<Record<string, boolean>>({});
  const isSaved = (propertyId: string) => pendingSaved[propertyId] ?? savedIds.includes(propertyId);

  const saveMutation = useMutation({
    mutationFn: ({ propertyId, save }: { propertyId: string; save: boolean }) =>
      unwrap(
        save ? renterService.saveListing(propertyId) : renterService.unsaveListing(propertyId)
      ),
    onMutate: ({ propertyId, save }) =>
      setPendingSaved((prev) => ({ ...prev, [propertyId]: save })),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: renterKeys.savedListings }),
        queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats }),
      ]),
    onSettled: (_data, _error, { propertyId }) =>
      setPendingSaved((prev) => {
        const next = { ...prev };
        delete next[propertyId];
        return next;
      }),
  });

  const toggleSave = (propertyId: string) => {
    saveMutation.mutate({ propertyId, save: !isSaved(propertyId) });
  };

  if (recommendedProperties.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
            Recommended for you
          </h2>
          <p className="text-sm text-muted-foreground">
            Based on your search history and preferences
          </p>
        </div>
        <Button href={ROUTES.RENTER_DISCOVER} variant="link" size="sm">
          View all
        </Button>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
          {recommendedProperties.map((property) => (
            <ListingCard
              key={property.id}
              href={buildRoute.renterPropertyDetail(property.id)}
              title={property.title}
              location={property.location}
              price={property.price}
              priceUnit={property.period}
              image={property.image}
              imageAlt={property.title}
              verified={property.verified}
              facts={{ beds: property.bedrooms, baths: property.bathrooms, size: property.size }}
              meta={
                property.rating > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                    <span className="data-value text-foreground">{property.rating}</span>
                    <span className="sr-only">rating</span>
                  </span>
                ) : undefined
              }
              actions={
                <ListingCardAction
                  label={isSaved(property.id) ? 'Remove from saved' : 'Save property'}
                  aria-pressed={isSaved(property.id)}
                  onClick={() => toggleSave(property.id)}
                  icon={<Heart fill={isSaved(property.id) ? 'currentColor' : 'none'} />}
                />
              }
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
