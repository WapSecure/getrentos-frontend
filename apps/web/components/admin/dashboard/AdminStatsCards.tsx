'use client';

import { motion } from 'framer-motion';
import { Users, ShieldCheck, Gavel, AlertTriangle, Landmark, TrendingUp } from 'lucide-react';
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
  gold: { bg: 'bg-[#c4a747]/10', icon: 'text-[#c4a747]' },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', icon: 'text-red-600 dark:text-red-400' },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
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
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a2a2f] border border-gray-200 dark:border-white/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#c4a747]/5 to-transparent" />

      <div className="relative p-4">
        <div
          className={`inline-flex p-2.5 rounded-xl ${colors.bg} transition-all duration-300 group-hover:scale-110 mb-3`}
        >
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className={`font-bold text-gray-900 dark:text-white tracking-tight ${valueSize}`}>
            {formattedValue}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c4a747] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

interface AdminStatsCardsProps {
  totalUsers: number;
  pendingVerifications: number;
  openDisputes: number;
  fraudAlerts: number;
  activeEscrowTransactions: number;
  platformGmv: number;
}

export const AdminStatsCards = ({
  totalUsers,
  pendingVerifications,
  openDisputes,
  fraudAlerts,
  activeEscrowTransactions,
  platformGmv,
}: AdminStatsCardsProps) => {
  const stats = [
    {
      icon: Users,
      label: 'Total Users',
      value: totalUsers,
      subtitle: 'Across all roles',
      color: 'blue',
      delay: 0,
    },
    {
      icon: ShieldCheck,
      label: 'Pending Verifications',
      value: pendingVerifications,
      subtitle: 'Awaiting review',
      color: 'gold',
      delay: 0.05,
    },
    {
      icon: Gavel,
      label: 'Open Disputes',
      value: openDisputes,
      subtitle: 'Needs resolution',
      color: 'orange',
      delay: 0.1,
    },
    {
      icon: AlertTriangle,
      label: 'Fraud Alerts',
      value: fraudAlerts,
      subtitle: 'Flagged for review',
      color: 'red',
      delay: 0.15,
    },
    {
      icon: Landmark,
      label: 'Active Escrow',
      value: activeEscrowTransactions,
      subtitle: 'In progress',
      color: 'purple',
      delay: 0.2,
    },
    {
      icon: TrendingUp,
      label: 'Platform GMV',
      value: platformGmv,
      subtitle: 'Lifetime',
      color: 'emerald',
      delay: 0.25,
      isCurrency: true,
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
