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
import { StatCard, type StatCardAccent } from '@getrentos/ui';
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
      label: 'Total Properties',
      value: totalProperties,
      subtitle: 'Across your portfolio',
      accent: 'blue',
    },
    {
      icon: DoorOpen,
      label: 'Occupied Units',
      value: occupiedUnits,
      subtitle: 'Signed and let',
      accent: 'green',
    },
    {
      icon: Clock,
      label: 'Reserved Units',
      value: reservedUnits,
      // Off the market but not let: a lease is out for signature or the first
      // payment is still due. Counting these as rented overstated the tenancy.
      subtitle: 'Awaiting signature or payment',
      accent: 'orange',
    },
    {
      icon: DoorClosed,
      label: 'Vacant Units',
      value: vacantUnits,
      subtitle: 'Available now',
      accent: 'blue',
    },
    {
      icon: Banknote,
      label: 'Annual Rent Roll',
      // Rent here is contracted and paid by the year. A "monthly revenue"
      // figure invited the reader to expect twelve payments and understated
      // the tenancy twelvefold.
      value: moneyVisible ? annualRentRoll : '••••••',
      subtitle: 'Contracted across let units, per year',
      accent: 'green',
      isCurrency: true,
    },
    {
      icon: AlertTriangle,
      label: 'Outstanding Rent',
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
      label: 'Active Maintenance',
      value: activeMaintenanceRequests,
      subtitle: 'Open tickets',
      accent: 'orange',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
