'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, Award, Target } from 'lucide-react';

interface PricePrediction {
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

const mockPrediction: PricePrediction = {
  currentPrice: 200000,
  predictedPrice: 185000,
  confidence: 85,
  trend: 'down',
  recommendation: 'Good time to negotiate - prices are expected to decrease',
};

export const DiscoverAIPricePredictor = () => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTrendIcon = () => {
    switch (mockPrediction.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-green-500" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTrendColor = () => {
    switch (mockPrediction.trend) {
      case 'up':
        return 'text-red-500';
      case 'down':
        return 'text-green-500';
      default:
        return 'text-yellow-500';
    }
  };

  const priceDiff = mockPrediction.predictedPrice - mockPrediction.currentPrice;
  const percentChange = ((priceDiff / mockPrediction.currentPrice) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-gray-50 to-white dark:from-[#1a2a2f] dark:to-[#0a1a1f] rounded-xl border border-gray-200 dark:border-white/10 p-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[#c4a747]" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Price Prediction</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Current Market Price</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(mockPrediction.currentPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Predicted Price (30 days)</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(mockPrediction.predictedPrice)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-gray-100 dark:bg-white/5">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {mockPrediction.trend === 'up' && `+${percentChange}% expected increase`}
            {mockPrediction.trend === 'down' && `${percentChange}% expected decrease`}
            {mockPrediction.trend === 'stable' && 'Stable market conditions'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Award className="w-3 h-3 text-[#c4a747]" />
          <span className="text-xs text-gray-500">{mockPrediction.confidence}% confidence</span>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Target className="w-4 h-4 text-[#c4a747] mt-0.5" />
        <p className="text-xs text-gray-600 dark:text-gray-400">{mockPrediction.recommendation}</p>
      </div>
    </motion.div>
  );
};
