'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { History, Eye } from 'lucide-react';
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

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) === 1 ? '' : 's'} ago`;
};

export const RecentlyViewed = () => {
  const { data: recentProperties = [] } = useQuery({
    queryKey: renterKeys.recentlyViewed,
    queryFn: () => unwrap(renterService.listRecentlyViewed()),
  });

  if (recentProperties.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Recently Viewed</h3>
        </div>
      </div>

      <div className="divide-y divide-border">
        {recentProperties.slice(0, 5).map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 hover:bg-secondary transition-colors"
          >
            <Link href={buildRoute.renterPropertyDetail(property.id)} className="flex gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{property.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{property.location}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs font-semibold text-primary">
                    {formatPrice(property.price)}/mo
                  </span>
                  <span className="text-xs text-gray-400">{formatTimeAgo(property.viewedAt)}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
