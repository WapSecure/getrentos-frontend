'use client';

import { useQuery } from '@tanstack/react-query';
import { StatGroup, StatGroupSkeleton } from '@sureground/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { renterKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

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
    ? `Ends ${new Date(lease.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
    : t('dashboard.stats.current_lease_subtitle');

  const { data: paymentsData } = useQuery({
    queryKey: [...renterKeys.payments, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(renterService.listPayments({ page: 1, pageSize: 100 })),
  });
  const payments = paymentsData?.items ?? [];
  const totalRentPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  if (statsLoading) {
    return <StatGroupSkeleton groups={[4, 2]} />;
  }

  return (
    <div className="space-y-4">
      <StatGroup
        title="Your search"
        items={[
          {
            label: t('dashboard.stats.saved_properties'),
            value: savedCount,
            subtitle: t('dashboard.stats.saved_properties_subtitle'),
            href: ROUTES.RENTER_SAVED,
          },
          {
            label: t('dashboard.stats.active_applications'),
            value: applicationsCount,
            subtitle: t('dashboard.stats.active_applications_subtitle'),
            href: ROUTES.RENTER_APPLICATIONS,
          },
          {
            label: t('dashboard.stats.viewings_scheduled'),
            value: viewingsCount,
            subtitle: t('dashboard.stats.viewings_scheduled_subtitle'),
            href: ROUTES.RENTER_VIEWINGS,
          },
          {
            label: t('dashboard.stats.unread_messages'),
            value: unreadCount,
            subtitle: t('dashboard.stats.unread_messages_subtitle'),
            href: ROUTES.RENTER_MESSAGES,
          },
        ]}
      />
      <StatGroup
        title="Your home"
        items={[
          {
            label: t('dashboard.stats.current_lease'),
            value: leaseStatus,
            subtitle: leaseEndLabel,
            href: ROUTES.RENTER_LEASE,
          },
          {
            label: t('dashboard.stats.total_rent_paid'),
            value: formatCurrency(totalRentPaid, { compact: true }),
            subtitle: t('dashboard.stats.total_rent_paid_subtitle'),
            href: ROUTES.RENTER_PAYMENTS,
          },
        ]}
      />
    </div>
  );
};
