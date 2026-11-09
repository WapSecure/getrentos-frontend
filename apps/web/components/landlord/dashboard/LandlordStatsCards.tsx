'use client';

import {
  AlertTriangle,
  Banknote,
  Building2,
  Clock,
  DoorClosed,
  DoorOpen,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { StatCard, type StatCardAccent } from '@sureground/ui';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';

interface LandlordStatsCardsProps {
  totalProperties: number;
  occupiedUnits: number;
  reservedUnits: number;
  vacantUnits: number;
  annualRentRoll: number;
  outstandingPayments: number;
  outstandingAmount: number;
  activeMaintenanceRequests: number;
}

export const LandlordStatsCards = ({
  totalProperties,
  occupiedUnits,
  reservedUnits,
  vacantUnits,
  annualRentRoll,
  outstandingPayments,
  outstandingAmount,
  activeMaintenanceRequests,
}: LandlordStatsCardsProps) => {
  const { visible: moneyVisible } = useMonetaryVisibility();
  const stats: {
    icon: LucideIcon;
    label: string;
    value: number | string;
    subtitle: string;
    accent: StatCardAccent;
    isCurrency?: boolean;
  }[] = [
    {
      icon: Building2,
      label: 'Total properties',
      value: totalProperties,
      subtitle: 'Across your portfolio',
      accent: 'blue',
    },
    {
      icon: DoorOpen,
      label: 'Occupied units',
      value: occupiedUnits,
      subtitle: 'Signed and let',
      accent: 'green',
    },
    {
      icon: Clock,
      label: 'Reserved units',
      value: reservedUnits,
      // Off the market but not let (awaiting signature or first payment), so not counted as rented.
      subtitle: 'Awaiting signature or payment',
      accent: 'orange',
    },
    {
      icon: DoorClosed,
      label: 'Vacant units',
      value: vacantUnits,
      subtitle: 'Available now',
      accent: 'blue',
    },
    {
      icon: Banknote,
      label: 'Annual rent roll',
      // Rent is contracted and paid yearly, so this is an annual figure, not monthly revenue.
      value: moneyVisible ? annualRentRoll : '••••••',
      subtitle: 'Contracted across let units, per year',
      accent: 'green',
      isCurrency: true,
    },
    {
      icon: AlertTriangle,
      label: 'Outstanding rent',
      value: moneyVisible ? outstandingAmount : '••••••',
      subtitle:
        outstandingPayments === 1
          ? 'Across 1 unpaid charge'
          : `Across ${outstandingPayments} unpaid charges`,
      accent: 'red',
      isCurrency: true,
    },
    {
      icon: Wrench,
      label: 'Active maintenance',
      value: activeMaintenanceRequests,
      subtitle: 'Open tickets',
      accent: 'orange',
    },
  ];

  return (
    <section aria-label="Portfolio overview" className="mb-8 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.slice(4).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.slice(0, 4).map((stat) => (
          <StatCard key={stat.label} {...stat} compact />
        ))}
      </div>
    </section>
  );
};
