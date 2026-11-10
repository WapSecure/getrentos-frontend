'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  CheckCircle,
  TrendingUp,
  FileText,
  MessageCircle,
  Wrench,
  Bell,
} from '@sureground/icons';
import { ActivityFeedCard } from '@/components/shared/dashboard/ActivityFeedCard';
import { ROUTES } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

type ActivityType = 'application' | 'message' | 'payment' | 'maintenance' | 'lease' | 'system';

const iconByType: Record<ActivityType, React.ElementType> = {
  application: FileText,
  message: MessageCircle,
  payment: TrendingUp,
  maintenance: Wrench,
  lease: Heart,
  system: CheckCircle,
};

const activityRoutes: Record<ActivityType, string> = {
  application: ROUTES.RENTER_APPLICATIONS,
  message: ROUTES.RENTER_MESSAGES,
  payment: ROUTES.RENTER_PAYMENTS,
  maintenance: ROUTES.RENTER_MAINTENANCE,
  lease: `${ROUTES.RENTER_HOME}?tab=lease`,
  system: ROUTES.RENTER_NOTIFICATIONS,
};

export const RenterRecentActivity = () => {
  const { data, isPending } = useQuery({
    queryKey: [...renterKeys.notifications, { page: 1, pageSize: 5 }],
    queryFn: () => unwrap(renterService.listNotifications({ page: 1, pageSize: 5 })),
  });
  const items = (data?.items ?? []).slice(0, 5).map((n) => ({
    id: n.id,
    icon: iconByType[n.type as ActivityType] ?? Bell,
    title: n.title,
    at: n.createdAt,
    href: activityRoutes[n.type as ActivityType] ?? ROUTES.RENTER_NOTIFICATIONS,
  }));

  if (!isPending && items.length === 0) return null;

  return (
    <ActivityFeedCard
      description="Important changes across your renter account"
      isLoading={isPending}
      emptyIcon={Bell}
      viewAllHref={ROUTES.RENTER_NOTIFICATIONS}
      items={items}
    />
  );
};
