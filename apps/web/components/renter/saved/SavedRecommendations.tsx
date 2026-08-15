'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, MapPin, Bed, Bath } from 'lucide-react';
import Link from 'next/link';
import { buildRoute } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

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
      className="bg-linear-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden"
    >
      <div className="p-3 border-b border-purple-200 dark:border-purple-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-foreground">Recommendations</h3>
      </div>

      <div className="divide-y divide-purple-200 dark:divide-purple-800">
        {recommendations.slice(0, 3).map((rec) => (
          <div
            key={rec.id}
            className="p-3 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
          >
            <Link href={buildRoute.renterPropertyDetail(rec.id)} className="block">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate hover:text-primary">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {rec.location}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-primary">{formatPrice(rec.price)}/mo</span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3" /> {rec.bedrooms} bd
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3 h-3" /> {rec.bathrooms} ba
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
