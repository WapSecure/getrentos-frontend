'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Banknote,
  Building2,
  Clock,
  DoorClosed,
  DoorOpen,
  Wrench,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtitle?: string;
  tone: StatTone;
  delay: number;
  isCurrency?: boolean;
}

/**
 * The accent behind each figure.
 *
 * Seven cards used to carry seven hues — blue, green, amber, orange, emerald,
 * red and purple — which is a colour per card rather than a colour per meaning,
 * and left `green` sitting next to `emerald` as if they said different things.
 * These are the five the design system has, so a card is now coloured by what it
 * reports: healthy, needs attention, or neutral.
 */
type StatTone = 'info' | 'success' | 'warning' | 'muted' | 'purple' | 'destructive';

const toneClasses: Record<StatTone, { bg: string; icon: string }> = {
  info: { bg: 'bg-info-subtle', icon: 'text-info' },
  success: { bg: 'bg-success-subtle', icon: 'text-success' },
  warning: { bg: 'bg-warning-subtle', icon: 'text-warning' },
  muted: { bg: 'bg-muted', icon: 'text-muted-foreground' },
  purple: { bg: 'bg-purple-subtle', icon: 'text-purple' },
  destructive: { bg: 'bg-destructive/10', icon: 'text-destructive' },
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  tone,
  delay,
  isCurrency,
}: StatCardProps) => {
  const formattedValue =
    isCurrency && typeof value === 'number' ? formatCurrency(value, { compact: true }) : value;
  const valueStr = String(formattedValue);
  const valueSize = valueStr.length > 10 ? 'text-lg' : valueStr.length > 8 ? 'text-xl' : 'text-2xl';
  const colors = toneClasses[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative p-4">
        <div
          className={`inline-flex p-2.5 rounded-xl ${colors.bg} transition-all duration-300 group-hover:scale-110 mb-3`}
        >
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className={`font-bold text-foreground tracking-tight ${valueSize}`}>
            {formattedValue}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};

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
  const stats: StatCardProps[] = [
    {
      icon: Building2,
      label: 'Total Properties',
      value: totalProperties,
      subtitle: 'Across your portfolio',
      tone: 'info',
      delay: 0,
    },
    {
      icon: DoorOpen,
      label: 'Occupied Units',
      value: occupiedUnits,
      subtitle: 'Signed and let',
      tone: 'success',
      delay: 0.05,
    },
    {
      icon: Clock,
      label: 'Reserved Units',
      value: reservedUnits,
      // Off the market but not let: a lease is out for signature or the first
      // payment is still due. Counting these as rented overstated the tenancy.
      subtitle: 'Awaiting signature or payment',
      tone: 'warning',
      delay: 0.08,
    },
    {
      icon: DoorClosed,
      label: 'Vacant Units',
      value: vacantUnits,
      subtitle: 'Available now',
      tone: 'muted',
      delay: 0.1,
    },
    {
      icon: Banknote,
      label: 'Annual Rent Roll',
      // Rent here is contracted and paid by the year. A "monthly revenue"
      // figure invited the reader to expect twelve payments and understated
      // the tenancy twelvefold.
      value: moneyVisible ? annualRentRoll : '••••••',
      subtitle: 'Contracted across let units, per year',
      tone: 'success',
      delay: 0.15,
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
      tone: 'destructive',
      delay: 0.2,
      isCurrency: true,
    },
    {
      icon: Wrench,
      label: 'Active Maintenance',
      value: activeMaintenanceRequests,
      subtitle: 'Open tickets',
      tone: 'warning',
      delay: 0.25,
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
