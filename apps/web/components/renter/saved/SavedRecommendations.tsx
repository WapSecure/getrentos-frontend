'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BadgeCheck } from '@sureground/icons';
import { isListingVerified } from '@sureground/shared';
import { ListingCard } from '@sureground/ui';
import { buildRoute } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export const SavedRecommendations = () => {
  const { data: recommendations = [] } = useQuery({
    queryKey: renterKeys.recommendations,
    queryFn: () => unwrap(renterService.getRecommendations()),
  });

  if (recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex items-center gap-2 border-b border-border p-3">
        <BadgeCheck className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Recommendations</h2>
      </div>

      <div className="space-y-2.5 p-3">
        {recommendations.slice(0, 3).map((rec) => (
          <ListingCard
            key={rec.id}
            variant="compact"
            headingLevel="h3"
            href={buildRoute.renterPropertyDetail(rec.id)}
            title={rec.title}
            location={rec.location}
            price={rec.price}
            priceUnit={rec.period}
            priceCompact
            image={rec.image}
            imageAlt=""
            verified={isListingVerified(rec)}
            facts={{ beds: rec.bedrooms, baths: rec.bathrooms }}
          />
        ))}
      </div>
    </motion.div>
  );
};
