'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Banknote, Building2, Clock, DoorClosed, DoorOpen, Wrench } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtitle?: string;
  color: string;
  delay: number;
  isCurrency?: boolean;
}

const colorClasses = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-50 dark:bg-green-950/20', icon: 'text-green-600 dark:text-green-400' },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', icon: 'text-red-600 dark:text-red-400' },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    icon: 'text-purple-600 dark:text-purple-400',
  },
} as const;

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  delay,
  isCurrency,
}: StatCardProps) => {
  const formattedValue =
    isCurrency && typeof value === 'number' ? formatCurrency(value, { compact: true }) : value;
  const valueStr = String(formattedValue);
  const valueSize = valueStr.length > 10 ? 'text-lg' : valueStr.length > 8 ? 'text-xl' : 'text-2xl';
  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-br from-primary/5 to-transparent" />

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

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
  const stats = [
    {
      icon: Building2,
      label: 'Total Properties',
      value: totalProperties,
      subtitle: 'Across your portfolio',
      color: 'blue',
      delay: 0,
    },
    {
      icon: DoorOpen,
      label: 'Occupied Units',
      value: occupiedUnits,
      subtitle: 'Signed and let',
      color: 'green',
      delay: 0.05,
    },
    {
      icon: Clock,
      label: 'Reserved Units',
      value: reservedUnits,
      // Off the market but not let: a lease is out for signature or the first
      // payment is still due. Counting these as rented overstated the tenancy.
      subtitle: 'Awaiting signature or payment',
      color: 'amber',
      delay: 0.08,
    },
    {
      icon: DoorClosed,
      label: 'Vacant Units',
      value: vacantUnits,
      subtitle: 'Available now',
      color: 'orange',
      delay: 0.1,
    },
    {
      icon: Banknote,
      label: 'Annual Rent Roll',
      // Rent here is contracted and paid by the year. A "monthly revenue"
      // figure invited the reader to expect twelve payments and understated
      // the tenancy twelvefold.
      value: annualRentRoll,
      subtitle: 'Contracted across let units, per year',
      color: 'emerald',
      delay: 0.15,
      isCurrency: true,
    },
    {
      icon: AlertTriangle,
      label: 'Outstanding Rent',
      value: outstandingAmount,
      subtitle:
        outstandingPayments === 1
          ? 'Across 1 unpaid charge'
          : `Across ${outstandingPayments} unpaid charges`,
      color: 'red',
      delay: 0.2,
      isCurrency: true,
    },
    {
      icon: Wrench,
      label: 'Active Maintenance',
      value: activeMaintenanceRequests,
      subtitle: 'Open tickets',
      color: 'purple',
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
