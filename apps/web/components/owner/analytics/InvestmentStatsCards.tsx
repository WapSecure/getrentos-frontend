'use client';

import { Wallet, TrendingUp, LineChart, Percent } from 'lucide-react';
import { StatCard } from '@sureground/ui';

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
}: InvestmentStatsCardsProps) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <StatCard icon={Wallet} label="Total invested" value={totalInvested} isCurrency accent="blue" />
    <StatCard
      icon={LineChart}
      label="Current portfolio value"
      value={totalCurrentValue}
      isCurrency
      accent="emerald"
    />
    <StatCard
      icon={TrendingUp}
      label="Avg. appreciation"
      value={`${avgAppreciationRate.toFixed(1)}%`}
      accent="primary"
    />
    <StatCard
      icon={Percent}
      label="Avg. ROI"
      value={`${avgRoiPercentage.toFixed(1)}%`}
      accent="green"
    />
  </div>
);
