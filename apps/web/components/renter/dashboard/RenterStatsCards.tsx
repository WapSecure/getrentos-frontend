'use client';

import { motion } from 'framer-motion';
import { Heart, FileText, MessageCircle, Calendar, Home, CreditCard } from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtitle?: string;
  color: string;
  delay: number;
  isCurrency?: boolean;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  delay,
  isCurrency,
}: StatCardProps) => {
  const formatValue = () => {
    if (isCurrency && typeof value === 'number') {
      const formatted = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

      if (value >= 1000000) {
        const millions = value / 1000000;
        return `₦${millions.toFixed(1)}M`;
      }
      if (value >= 1000) {
        const thousands = value / 1000;
        return `₦${thousands.toFixed(0)}K`;
      }
      return formatted;
    }
    return value;
  };

  const getValueSize = () => {
    if (!isCurrency) return 'text-2xl';
    const valueStr = formatValue().toString();
    if (valueStr.length > 10) return 'text-lg';
    if (valueStr.length > 8) return 'text-xl';
    return 'text-2xl';
  };

  const colorClasses = {
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-950/20',
      icon: 'text-pink-600 dark:text-pink-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      icon: 'text-green-600 dark:text-green-400',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      icon: 'text-orange-600 dark:text-orange-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      icon: 'text-purple-600 dark:text-purple-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  const valueSize = getValueSize();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a2a2f] border border-gray-200 dark:border-white/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#c4a747]/5 to-transparent" />

      <div className="relative p-4">
        {/* Icon at the top */}
        <div
          className={`inline-flex p-2.5 rounded-xl ${colors.bg} transition-all duration-300 group-hover:scale-110 mb-3`}
        >
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        {/* Content below icon */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className={`font-bold text-gray-900 dark:text-white tracking-tight ${valueSize}`}>
            {formatValue()}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c4a747] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export const RenterStatsCards = () => {
  const stats = [
    {
      icon: Heart,
      label: 'Saved Properties',
      value: 12,
      subtitle: '3 new this week',
      color: 'pink',
      delay: 0,
    },
    {
      icon: FileText,
      label: 'Active Applications',
      value: 3,
      subtitle: '2 under review',
      color: 'blue',
      delay: 0.05,
    },
    {
      icon: MessageCircle,
      label: 'Unread Messages',
      value: 8,
      subtitle: 'From 3 landlords',
      color: 'green',
      delay: 0.1,
    },
    {
      icon: Calendar,
      label: 'Viewings Scheduled',
      value: 2,
      subtitle: 'This week',
      color: 'orange',
      delay: 0.15,
    },
    {
      icon: Home,
      label: 'Current Lease',
      value: 'Active',
      subtitle: 'Ends Dec 2024',
      color: 'purple',
      delay: 0.2,
    },
    {
      icon: CreditCard,
      label: 'Total Rent Paid',
      value: 2450000,
      subtitle: 'Lifetime',
      color: 'emerald',
      delay: 0.25,
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          subtitle={stat.subtitle}
          color={stat.color}
          delay={stat.delay}
          isCurrency={stat.isCurrency}
        />
      ))}
    </div>
  );
};
