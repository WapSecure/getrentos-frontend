'use client';

import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Handshake,
  Megaphone,
  Users,
  Wallet,
} from 'lucide-react';
import { IconButton, StatCard, type StatCardAccent } from '@sureground/ui';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';

interface OwnerStatsCardsProps {
  totalProperties: number;
  activeSaleListings: number;
  buyerInquiries: number;
  pendingOffers: number;
  totalPortfolioValue: number;
  completedSales: number;
}

export const OwnerStatsCards = ({
  totalProperties,
  activeSaleListings,
  buyerInquiries,
  pendingOffers,
  totalPortfolioValue,
  completedSales,
}: OwnerStatsCardsProps) => {
  const { visible, toggle } = useMonetaryVisibility();
  const stats: Array<{
    icon: typeof Building2;
    label: string;
    value: number | string;
    subtitle: string;
    accent: StatCardAccent;
    isCurrency?: boolean;
  }> = [
    {
      icon: Building2,
      label: 'Properties',
      value: totalProperties,
      subtitle: 'Across your portfolio',
      accent: 'blue',
    },
    {
      icon: Megaphone,
      label: 'Active listings',
      value: activeSaleListings,
      subtitle: 'Published for sale',
      accent: 'orange',
    },
    {
      icon: Users,
      label: 'Buyer enquiries',
      value: buyerInquiries,
      subtitle: 'Recent buyer activity',
      accent: 'primary',
    },
    {
      icon: Handshake,
      label: 'Pending offers',
      value: pendingOffers,
      subtitle: 'Awaiting a response',
      accent: 'orange',
    },
    {
      icon: Wallet,
      label: 'Portfolio value',
      value: visible ? totalPortfolioValue : '••••••',
      subtitle: 'Current estimate',
      accent: 'green',
      isCurrency: true,
    },
    {
      icon: CheckCircle2,
      label: 'Completed sales',
      value: completedSales,
      subtitle: 'Lifetime',
      accent: 'green',
    },
  ];

  return (
    <section aria-label="Portfolio overview" className="mb-8">
      <div className="mb-3 flex justify-end">
        <IconButton
          label={visible ? 'Hide monetary values' : 'Show monetary values'}
          icon={visible ? <EyeOff /> : <Eye />}
          onClick={toggle}
          size="sm"
          variant="ghost"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} compact />
        ))}
      </div>
    </section>
  );
};
