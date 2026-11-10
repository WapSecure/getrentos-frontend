'use client';

import { CreditCard, Wrench, CalendarClock, UserPlus, ReceiptText } from '@sureground/icons';
import { useQuery } from '@tanstack/react-query';
import { ActivityFeedCard } from '@/components/shared/dashboard/ActivityFeedCard';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

type ActivityType = 'payment' | 'maintenance' | 'lease' | 'application' | 'expense';

const typeConfig: Record<ActivityType, React.ElementType> = {
  payment: CreditCard,
  maintenance: Wrench,
  lease: CalendarClock,
  application: UserPlus,
  expense: ReceiptText,
};

const typeFor = (type: string): ActivityType => {
  switch (type) {
    case 'payment':
      return 'payment';
    case 'maintenance':
      return 'maintenance';
    case 'lease':
      return 'lease';
    case 'application':
      return 'application';
    case 'expense':
      return 'expense';
    default:
      return 'payment';
  }
};

export const LandlordActivityFeed = () => {
  const { data: activity = [], isPending } = useQuery({
    queryKey: landlordKeys.dashboardActivity,
    queryFn: () => unwrap(landlordService.getDashboardActivity()),
  });

  return (
    <ActivityFeedCard
      description="Payments, maintenance, and lease updates"
      isLoading={isPending}
      emptyIcon={CreditCard}
      viewAllHref="/landlord/activity"
      items={activity.map((item) => ({
        id: item.id,
        icon: typeConfig[typeFor(item.type)],
        title: item.title,
        detail: item.description,
        at: item.timestamp,
      }))}
    />
  );
};
