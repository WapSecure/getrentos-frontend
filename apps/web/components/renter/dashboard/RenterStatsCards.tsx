'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, FileText, MessageCircle, Calendar, Home, CreditCard } from 'lucide-react';
import { StatGridSkeleton } from '@getrentos/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
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
      return formatCurrency(value, { compact: true });
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
      bg: 'bg-destructive-subtle',
      icon: 'text-destructive',
    },
    blue: {
      bg: 'bg-info-subtle',
      icon: 'text-info',
    },
    green: {
      bg: 'bg-success-subtle',
      icon: 'text-success',
    },
    orange: {
      bg: 'bg-warning-subtle',
      icon: 'text-warning',
    },
    purple: {
      bg: 'bg-purple-subtle',
      icon: 'text-purple',
    },
    emerald: {
      bg: 'bg-primary/10',
      icon: 'text-primary',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  const valueSize = getValueSize();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
    >
      <div className="relative p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="text-sm leading-5 text-muted-foreground">{label}</p>
          <div className={`inline-flex shrink-0 rounded-xl p-2.5 ${colors.bg}`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
        </div>

        <div>
          <p className={`font-bold text-foreground tracking-tight ${valueSize}`}>{formatValue()}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export const RenterStatsCards = () => {
  const { t } = useLanguage();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
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

  const { data: paymentsData } = useQuery({
    queryKey: [...renterKeys.payments, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(renterService.listPayments({ page: 1, pageSize: 100 })),
  });
  const payments = paymentsData?.items ?? [];
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

  if (statsLoading) {
    return (
      <StatGridSkeleton count={6} className="gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" />
    );
  }

  return (
    <section
      aria-label="Renter account overview"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
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
    </section>
  );
};
