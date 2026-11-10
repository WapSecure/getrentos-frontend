'use client';

import { Handshake, CalendarClock, ShieldCheck, Heart } from '@sureground/icons';
import { ActivityFeedCard } from '@/components/shared/dashboard/ActivityFeedCard';
import type { BuyerDashboard } from '@/services/buyerService';

type ActivityType = 'offer' | 'viewing' | 'escrow' | 'saved';

const typeConfig: Record<ActivityType, React.ElementType> = {
  offer: Handshake,
  viewing: CalendarClock,
  escrow: ShieldCheck,
  saved: Heart,
};

const titleFor = (type: string): string => {
  switch (type) {
    case 'offer':
      return 'Offer update';
    case 'viewing':
      return 'Viewing update';
    case 'saved':
      return 'Saved property';
    default:
      return 'Activity';
  }
};

const typeFor = (type: string): ActivityType => {
  switch (type) {
    case 'offer':
      return 'offer';
    case 'viewing':
      return 'viewing';
    case 'saved':
      return 'saved';
    default:
      return 'escrow';
  }
};

interface BuyerActivityFeedProps {
  activity: BuyerDashboard['recentActivity'];
}

export const BuyerActivityFeed = ({ activity }: BuyerActivityFeedProps) => {
  return (
    <ActivityFeedCard
      description="Offers, viewings, payments, and saved property updates"
      emptyIcon={Heart}
      items={activity.map((item) => ({
        id: item.id,
        icon: typeConfig[typeFor(item.type)],
        title: titleFor(item.type),
        detail: item.message,
        at: item.timestamp,
      }))}
    />
  );
};
