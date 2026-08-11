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
  currentPrice: 2400000,
  predictedPrice: 2220000,
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
      className="bg-linear-to-br from-secondary to-card dark:from-card dark:to-background rounded-xl border border-border p-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">AI Price Prediction</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Current Market Price</p>
          <p className="text-lg font-bold text-foreground">
            {formatPrice(mockPrediction.currentPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Predicted Price (30 days)</p>
          <p className="text-lg font-bold text-foreground">
            {formatPrice(mockPrediction.predictedPrice)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-secondary">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {mockPrediction.trend === 'up' && `+${percentChange}% expected increase`}
            {mockPrediction.trend === 'down' && `${percentChange}% expected decrease`}
            {mockPrediction.trend === 'stable' && 'Stable market conditions'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Award className="w-3 h-3 text-primary" />
          <span className="text-xs text-gray-500">{mockPrediction.confidence}% confidence</span>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Target className="w-4 h-4 text-primary mt-0.5" />
        <p className="text-xs text-muted-foreground">{mockPrediction.recommendation}</p>
      </div>
    </motion.div>
  );
};
