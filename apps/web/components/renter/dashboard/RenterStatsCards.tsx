'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, FileText, MessageCircle, Calendar, Home, CreditCard } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

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
      className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-br from-primary/5 to-transparent" />

      <div className="relative p-4">
        {/* Icon at the top */}
        <div
          className={`inline-flex p-2.5 rounded-xl ${colors.bg} transition-all duration-300 group-hover:scale-110 mb-3`}
        >
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        {/* Content below icon */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className={`font-bold text-foreground tracking-tight ${valueSize}`}>{formatValue()}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export const RenterStatsCards = () => {
  const { t } = useLanguage();

  const { data: dashboardStats } = useQuery({
    queryKey: renterKeys.dashboardStats,
    queryFn: () => unwrap(renterService.getDashboardStats()),
  });
  const savedCount = dashboardStats?.savedPropertiesCount ?? 0;
  const applicationsCount = dashboardStats?.activeApplicationsCount ?? 0;
  const unreadCount = dashboardStats?.unreadMessagesCount ?? 0;
  const viewingsCount = dashboardStats?.upcomingViewingsCount ?? 0;

  const { data: lease } = useQuery({
    queryKey: renterKeys.lease,
    queryFn: () => unwrap(renterService.getLease()),
  });
  const leaseStatus = lease ? lease.status.charAt(0).toUpperCase() + lease.status.slice(1) : '—';
  const leaseEndLabel = lease?.endDate
    ? `Ends ${new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
    : t('dashboard.stats.current_lease_subtitle');

  const { data: payments = [] } = useQuery({
    queryKey: renterKeys.payments,
    queryFn: () => unwrap(renterService.listPayments()),
  });
  const totalRentPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    {
      icon: Heart,
      label: t('dashboard.stats.saved_properties'),
      value: savedCount,
      subtitle: t('dashboard.stats.saved_properties_subtitle'),
      color: 'pink',
      delay: 0,
    },
    {
      icon: FileText,
      label: t('dashboard.stats.active_applications'),
      value: applicationsCount,
      subtitle: t('dashboard.stats.active_applications_subtitle'),
      color: 'blue',
      delay: 0.05,
    },
    {
      icon: MessageCircle,
      label: t('dashboard.stats.unread_messages'),
      value: unreadCount,
      subtitle: t('dashboard.stats.unread_messages_subtitle'),
      color: 'green',
      delay: 0.1,
    },
    {
      icon: Calendar,
      label: t('dashboard.stats.viewings_scheduled'),
      value: viewingsCount,
      subtitle: t('dashboard.stats.viewings_scheduled_subtitle'),
      color: 'orange',
      delay: 0.15,
    },
    {
      icon: Home,
      label: t('dashboard.stats.current_lease'),
      value: leaseStatus,
      subtitle: leaseEndLabel,
      color: 'purple',
      delay: 0.2,
    },
    {
      icon: CreditCard,
      label: t('dashboard.stats.total_rent_paid'),
      value: totalRentPaid,
      subtitle: t('dashboard.stats.total_rent_paid_subtitle'),
      color: 'emerald',
      delay: 0.25,
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => (
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
