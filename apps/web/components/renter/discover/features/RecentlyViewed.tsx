'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Eye } from 'lucide-react';
import Link from 'next/link';
import { buildRoute } from '@/lib/constants/auth';

interface RecentlyViewedProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  viewedAt: string;
}

export const RecentlyViewed = () => {
  const [recentProperties, setRecentProperties] = useState<RecentlyViewedProperty[]>([]);

  useEffect(() => {
    const recent = localStorage.getItem('recently_viewed');
    if (recent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecentProperties(JSON.parse(recent).slice(0, 5));
    }
  }, []);

  const handleClear = () => {
    localStorage.removeItem('recently_viewed');
    setRecentProperties([]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (recentProperties.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Recently Viewed</h3>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="divide-y divide-border">
        {recentProperties.map((property, index) => (
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
                <p className="text-xs font-semibold text-primary mt-0.5">
                  {formatPrice(property.price)}/mo
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
