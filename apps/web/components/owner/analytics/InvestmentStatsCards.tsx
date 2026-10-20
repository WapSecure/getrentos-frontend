'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, LineChart, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface InvestmentStatsCardsProps {
  totalInvested: number;
  totalCurrentValue: number;
  avgAppreciationRate: number;
  avgRoiPercentage: number;
}

export const InvestmentStatsCards = ({
  totalInvested,
  totalCurrentValue,
  avgAppreciationRate,
  avgRoiPercentage,
}: InvestmentStatsCardsProps) => {
  const stats = [
    {
      icon: Wallet,
      label: 'Total Invested',
      value: formatCurrency(totalInvested, { compact: true }),
      color: 'blue',
    },
    {
      icon: LineChart,
      label: 'Current Portfolio Value',
      value: formatCurrency(totalCurrentValue, { compact: true }),
      color: 'emerald',
    },
    {
      icon: TrendingUp,
      label: 'Avg. Appreciation',
      value: `${avgAppreciationRate.toFixed(1)}%`,
      color: 'gold',
    },
    { icon: Percent, label: 'Avg. ROI', value: `${avgRoiPercentage.toFixed(1)}%`, color: 'green' },
  ];

  const colorClasses = {
    blue: { bg: 'bg-info-subtle', icon: 'text-info' },
    emerald: {
      bg: 'bg-success-subtle',
      icon: 'text-success',
    },
    gold: { bg: 'bg-accent', icon: 'text-primary' },
    green: { bg: 'bg-success-subtle', icon: 'text-success' },
  } as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const colors = colorClasses[stat.color as keyof typeof colorClasses];
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="rounded-2xl bg-card border border-border p-4"
          >
            <div className={`inline-flex p-2.5 rounded-xl ${colors.bg} mb-3`}>
              <stat.icon className={`w-5 h-5 ${colors.icon}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
};
