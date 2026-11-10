'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BadgeCheck } from '@sureground/icons';
import { ListingCard } from '@sureground/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { buildRoute } from '@/lib/constants/auth';

export const DiscoverRecommendations = () => {
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: renterKeys.recommendations,
    queryFn: () => unwrap(renterService.getRecommendations()),
  });

  if (isLoading) return null;
  if (recommendations.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 p-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <BadgeCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Matched to your saved and viewed properties
            </p>
          </div>
        </div>

        <div className="space-y-2.5 p-4 pt-0">
          {recommendations.slice(0, 3).map((rec) => (
            <ListingCard
              key={rec.id}
              variant="compact"
              headingLevel="h4"
              href={buildRoute.renterPropertyDetail(rec.id)}
              title={rec.title}
              location={rec.location}
              price={rec.price}
              priceUnit={rec.period}
              priceCompact
              image={rec.image}
              imageAlt=""
              verified={rec.verified}
              facts={{ beds: rec.bedrooms, baths: rec.bathrooms }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
