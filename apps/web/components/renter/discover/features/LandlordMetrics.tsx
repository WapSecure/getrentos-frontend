'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Star, Shield, TrendingUp } from 'lucide-react';

interface LandlordMetricsProps {
  responseRate: number;
  responseTime: string;
  rating: number;
  totalReviews: number;
  verifiedBadge: boolean;
}

export const LandlordMetrics = ({
  responseRate,
  responseTime,
  rating,
  totalReviews,
  verifiedBadge,
}: LandlordMetricsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 mt-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3 h-3 text-primary" />
          <span className="text-xs text-muted-foreground">Landlord Response</span>
        </div>
        {verifiedBadge && (
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-600">Verified</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-lg font-bold text-foreground">{responseRate}%</p>
          <p className="text-xs text-gray-500">Response rate</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{responseTime}</p>
          <p className="text-xs text-gray-500">Avg. response</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-primary text-primary" />
          <span className="text-sm font-semibold text-foreground">{rating}</span>
          <span className="text-xs text-gray-500">({totalReviews} reviews)</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-600" />
          <span className="text-xs text-green-600">Active</span>
        </div>
      </div>
    </motion.div>
  );
};
