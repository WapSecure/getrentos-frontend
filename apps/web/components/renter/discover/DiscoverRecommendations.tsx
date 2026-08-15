'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, MapPin, Bed, Bath } from 'lucide-react';
import Link from 'next/link';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { buildRoute } from '@/lib/constants/auth';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

export const DiscoverRecommendations = () => {
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: renterKeys.recommendations,
    queryFn: () => unwrap(renterService.getRecommendations()),
  });

  if (isLoading) return null;
  if (recommendations.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="bg-linear-to-r from-primary/10 to-transparent rounded-xl border border-primary/20 overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Matched to your saved and viewed properties
            </p>
          </div>
        </div>

        <div className="p-4 pt-0 space-y-3">
          {recommendations.slice(0, 3).map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-white/50 dark:bg-white/5"
            >
              <div className="flex-1 min-w-0">
                <Link href={buildRoute.renterPropertyDetail(rec.id)}>
                  <h4 className="text-sm font-semibold text-foreground hover:text-primary">
                    {rec.title}
                  </h4>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {rec.location}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                  <span className="font-semibold text-primary">{formatPrice(rec.price)}/mo</span>
                  <span className="flex items-center gap-1">
                    <Bed className="w-3 h-3" /> {rec.bedrooms} bd
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-3 h-3" /> {rec.bathrooms} ba
                  </span>
                </div>
              </div>
              <Link
                href={buildRoute.renterPropertyDetail(rec.id)}
                className="inline-flex items-center text-xs text-primary hover:underline shrink-0 mt-1"
              >
                View <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
