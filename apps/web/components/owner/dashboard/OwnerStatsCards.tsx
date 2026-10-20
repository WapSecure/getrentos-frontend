'use client';

import { motion } from 'framer-motion';
import {
  Building2,
  Megaphone,
  Users,
  Handshake,
  Wallet,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { IconButton } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtitle?: string;
  color: string;
  delay: number;
  isCurrency?: boolean;
  moneyVisible?: boolean;
  onToggleMoney?: () => void;
}

const colorClasses = {
  blue: { bg: 'bg-info-subtle', icon: 'text-info' },
  orange: {
    bg: 'bg-warning-subtle',
    icon: 'text-warning',
  },
  purple: {
    bg: 'bg-primary/10',
    icon: 'text-primary',
  },
  emerald: {
    bg: 'bg-success-subtle',
    icon: 'text-success',
  },
  gold: { bg: 'bg-accent', icon: 'text-primary' },
  green: { bg: 'bg-success-subtle', icon: 'text-success' },
} as const;

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  delay,
  isCurrency,
  moneyVisible = true,
  onToggleMoney,
}: StatCardProps) => {
  const formattedValue =
    isCurrency && !moneyVisible
      ? '••••••'
      : isCurrency && typeof value === 'number'
        ? formatCurrency(value, { compact: true })
        : value;
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
      <div className="relative p-4">
        {isCurrency && onToggleMoney ? (
          <IconButton
            onClick={onToggleMoney}
            label={moneyVisible ? 'Hide monetary values' : 'Show monetary values'}
            icon={moneyVisible ? <EyeOff /> : <Eye />}
            size="sm"
            className="absolute right-3 top-3"
          />
        ) : null}
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
  const { visible: moneyVisible, toggle: onToggleMoney } = useMonetaryVisibility();
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
      icon: Megaphone,
      label: 'Active Sale Listings',
      value: activeSaleListings,
      subtitle: 'Published for sale',
      color: 'orange',
      delay: 0.05,
    },
    {
      icon: Users,
      label: 'Buyer Inquiries',
      value: buyerInquiries,
      subtitle: 'Active leads',
      color: 'purple',
      delay: 0.1,
    },
    {
      icon: Handshake,
      label: 'Pending Offers',
      value: pendingOffers,
      subtitle: 'Awaiting response',
      color: 'gold',
      delay: 0.15,
    },
    {
      icon: Wallet,
      label: 'Portfolio Value',
      value: totalPortfolioValue,
      subtitle: 'Estimated total',
      color: 'emerald',
      delay: 0.2,
      isCurrency: true,
    },
    {
      icon: CheckCircle2,
      label: 'Completed Sales',
      value: completedSales,
      subtitle: 'Lifetime',
      color: 'green',
      delay: 0.25,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          {...stat}
          moneyVisible={moneyVisible}
          onToggleMoney={onToggleMoney}
        />
      ))}
    </div>
  );
};
