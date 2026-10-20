'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Square, Heart, Eye, Star, Home } from 'lucide-react';
import { Badge } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { IconButton } from '@getrentos/ui';
import { formatPrice } from '@/types/renter';
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
  const [failedImages, setFailedImages] = useState<string[]>([]);
  // Shown at once while the request runs; dropped when it settles, so a
  // failed save falls back to the server's list.
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
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-border/70 p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Recommended for You</h2>
          <p className="text-sm text-muted-foreground">
            Based on your search history and preferences
          </p>
        </div>
        <Button href={ROUTES.RENTER_DISCOVER} variant="ghost" size="sm" className="gap-1">
          View All
          <Eye className="w-3 h-3" />
        </Button>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendedProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + index * 0.05, duration: 0.3 }}
              className="overflow-hidden rounded-2xl border border-border/70 bg-background transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
            >
              <div className="relative h-40 bg-muted">
                {property.image && !failedImages.includes(property.id) ? (
                  // Signed MinIO URLs, so plain <img> rather than next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={property.image}
                    alt={property.title}
                    loading="lazy"
                    onError={() => setFailedImages((prev) => [...prev, property.id])}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto">
                        <Home className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">No photo yet</p>
                    </div>
                  </div>
                )}
                {property.verified && (
                  <Badge variant="success" className="absolute top-2 left-2">
                    Verified
                  </Badge>
                )}
                <IconButton
                  label={isSaved(property.id) ? 'Remove from saved' : 'Save property'}
                  aria-pressed={isSaved(property.id)}
                  size="sm"
                  onClick={() => toggleSave(property.id)}
                  className="absolute top-2 right-2 rounded-full bg-card/90 hover:bg-card"
                  icon={
                    <Heart
                      className={
                        isSaved(property.id) ? 'fill-destructive text-destructive' : undefined
                      }
                    />
                  }
                />
              </div>

              {/* Property Details */}
              <div className="p-3">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="min-w-0 font-semibold text-foreground text-sm">{property.title}</h3>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-xs text-muted-foreground">{property.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>{property.location}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-3 h-3" />
                    <span>{property.bathrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Square className="w-3 h-3" />
                    <span>{property.size} sqm</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(property.price, property.period)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    href={buildRoute.renterPropertyDetail(property.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
