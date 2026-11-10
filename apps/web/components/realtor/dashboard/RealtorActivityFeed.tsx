'use client';

import { useQuery } from '@tanstack/react-query';
import { UserPlus, CalendarClock, Handshake, Wallet, Inbox } from '@sureground/icons';
import { ActivityFeedCard } from '@/components/shared/dashboard/ActivityFeedCard';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';

type ActivityType = 'lead' | 'viewing' | 'offer' | 'commission';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
}

const typeConfig: Record<ActivityType, React.ElementType> = {
  lead: UserPlus,
  viewing: CalendarClock,
  offer: Handshake,
  commission: Wallet,
};

export const RealtorActivityFeed = () => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: realtorKeys.activity,
    queryFn: () =>
      unwrap(realtorService.getDashboardActivity()).then((list) =>
        list.map(
          (item): ActivityItem => ({
            id: item.id,
            type: (item.type === 'offer'
              ? 'offer'
              : item.type === 'viewing'
                ? 'viewing'
                : item.type === 'commission'
                  ? 'commission'
                  : 'lead') as ActivityType,
            title: item.title,
            description: item.description,
            time: item.date,
          })
        )
      ),
  });

  return (
    <ActivityFeedCard
      description="Leads, viewings, offers, and commission updates"
      isLoading={isLoading}
      emptyIcon={Inbox}
      items={items.map((item) => ({
        id: item.id,
        icon: typeConfig[item.type],
        title: item.title,
        detail: item.description,
        at: item.time,
      }))}
    />
  );
};
