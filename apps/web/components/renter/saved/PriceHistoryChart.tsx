'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PriceHistoryChartProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

// Mock price history data
const getPriceHistory = (propertyId: string) => {
  return [
    { date: 'Jan 2024', price: 210000 },
    { date: 'Feb 2024', price: 208000 },
    { date: 'Mar 2024', price: 205000 },
    { date: 'Apr 2024', price: 202000 },
    { date: 'May 2024', price: 200000 },
    { date: 'Jun 2024', price: 198000 },
  ];
};

export const PriceHistoryChart = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
}: PriceHistoryChartProps) => {
  const priceHistory = getPriceHistory(propertyId);
  const maxPrice = Math.max(...priceHistory.map((p) => p.price));
  const minPrice = Math.min(...priceHistory.map((p) => p.price));
  const currentPrice = priceHistory[priceHistory.length - 1].price;
  const firstPrice = priceHistory[0].price;
  const priceChange = currentPrice - firstPrice;
  const percentChange = (priceChange / firstPrice) * 100;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getChartHeight = (price: number) => {
    const range = maxPrice - minPrice;
    if (range === 0) return 40;
    const percentage = ((price - minPrice) / range) * 60;
    return Math.max(20, percentage);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-lg w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Price History</h3>
                <p className="text-xs text-gray-500 mt-0.5">{propertyTitle}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <div>
                  <p className="text-xs text-gray-500">Current Price</p>
                  <p className="text-lg font-bold text-foreground">{formatPrice(currentPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Price Change</p>
                  <div className="flex items-center gap-1">
                    {priceChange > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : priceChange < 0 ? (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-500" />
                    )}
                    <span
                      className={`text-lg font-bold ${priceChange > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {priceChange > 0 ? '+' : ''}
                      {formatPrice(Math.abs(priceChange))}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">% Change</p>
                  <span
                    className={`text-lg font-bold ${percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {percentChange > 0 ? '+' : ''}
                    {percentChange.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-500">Price Trend (Last 6 months)</span>
                  <span className="text-xs text-green-600">↓ Price decreased</span>
                </div>
                <div className="relative h-48">
                  {/* Chart Bars */}
                  <div className="absolute inset-0 flex items-end justify-between gap-2">
                    {priceHistory.map((item, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: getChartHeight(item.price) }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className={`w-full rounded-t-lg ${
                            item.price === currentPrice
                              ? 'bg-primary'
                              : item.price < firstPrice
                                ? 'bg-green-400'
                                : 'bg-gray-400'
                          }`}
                          style={{ height: getChartHeight(item.price) }}
                        />
                        <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                          {item.date.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300">
                  💡 Price has decreased by {Math.abs(percentChange).toFixed(1)}% over the last 6
                  months. This could be a good time to negotiate or make an offer.
                </p>
              </div>

              <Button variant="primary" onClick={onClose} fullWidth>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
