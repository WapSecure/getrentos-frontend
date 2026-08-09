'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';

interface RentIncrease {
  date: string;
  oldAmount: number;
  newAmount: number;
  percentageChange: number;
  reason: string;
}

interface RentIncreaseHistoryProps {
  increases: RentIncrease[];
}

export const RentIncreaseHistory = ({ increases }: RentIncreaseHistoryProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Rent Increase History</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Historical rent changes</p>
      </div>

      <div className="divide-y divide-border">
        {increases.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No rent increases recorded</div>
        ) : (
          increases.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-muted-foreground">{formatDate(item.date)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(item.oldAmount)}
                    </span>
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.newAmount)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xs rounded-full">
                    <DollarSign className="w-3 h-3" />+{item.percentageChange}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
