'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  CalendarClock,
  FileSignature,
  FileText,
  Heart,
  MessageCircle,
} from '@sureground/icons';
import { StatGroup, StatGroupSkeleton } from '@sureground/ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { renterKeys } from '@/lib/queryKeys';
import { rentPaidFigure } from '@/lib/rentPaidFigure';
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

  const { data: lease, isLoading: leaseLoading } = useQuery({
    queryKey: renterKeys.lease,
    queryFn: () => unwrap(renterService.getLease()),
  });
  const leaseStatus = lease
    ? lease.status.charAt(0).toUpperCase() + lease.status.slice(1)
    : t('dashboard.stats.no_lease');
  const leaseEndLabel = !lease
    ? t('dashboard.stats.no_lease_subtitle')
    : lease.endDate
      ? `Ends ${new Date(lease.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
      : t('dashboard.stats.current_lease_subtitle');

  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    isError: paymentsError,
  } = useQuery({
    queryKey: [...renterKeys.payments, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(renterService.listPayments({ page: 1, pageSize: 100 })),
  });
  const rentPaid = rentPaidFigure(paymentsData, {
    isLoading: paymentsLoading,
    isError: paymentsError,
  });

  // Each figure waits for its own query: rendering before then showed "₦0" and "—" as if real.
  if (statsLoading) {
    return <StatGroupSkeleton groups={[4, 2]} />;
  }
  const homeLoading = leaseLoading || rentPaid.state === 'loading';

  return (
    <div className="space-y-4">
      <StatGroup
        title={t('dashboard.groups.your_search')}
        items={[
          {
            label: t('dashboard.stats.saved_properties'),
            icon: Heart,
            value: savedCount,
            subtitle: t('dashboard.stats.saved_properties_subtitle'),
            href: ROUTES.RENTER_SAVED,
          },
          {
            label: t('dashboard.stats.active_applications'),
            icon: FileText,
            value: applicationsCount,
            subtitle: t('dashboard.stats.active_applications_subtitle'),
            href: ROUTES.RENTER_APPLICATIONS,
          },
          {
            label: t('dashboard.stats.viewings_scheduled'),
            icon: CalendarClock,
            value: viewingsCount,
            subtitle: t('dashboard.stats.viewings_scheduled_subtitle'),
            href: ROUTES.RENTER_VIEWINGS,
          },
          {
            label: t('dashboard.stats.unread_messages'),
            icon: MessageCircle,
            value: unreadCount,
            subtitle: t('dashboard.stats.unread_messages_subtitle'),
            href: ROUTES.RENTER_MESSAGES,
          },
        ]}
      />
      {homeLoading ? (
        <StatGroupSkeleton groups={[2]} />
      ) : (
        <StatGroup
          title={t('dashboard.groups.your_home')}
          items={[
            {
              label: t('dashboard.stats.current_lease'),
              icon: FileSignature,
              value: leaseStatus,
              subtitle: leaseEndLabel,
              href: ROUTES.RENTER_LEASE,
            },
            {
              label: t('dashboard.stats.total_rent_paid'),
              icon: Banknote,
              value:
                rentPaid.state === 'ready'
                  ? formatCurrency(rentPaid.naira, { compact: true })
                  : 'Unavailable',
              subtitle:
                rentPaid.state === 'ready'
                  ? t('dashboard.stats.total_rent_paid_subtitle')
                  : 'Could not load your payments',
              href: ROUTES.RENTER_PAYMENTS,
            },
          ]}
        />
      )}
    </div>
  );
};
