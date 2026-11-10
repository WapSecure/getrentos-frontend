'use client';

import { Users, Handshake, ShieldCheck, FileCheck } from '@sureground/icons';
import { ActivityFeedCard } from '@/components/shared/dashboard/ActivityFeedCard';
import type { OwnerDashboard } from '@/services/ownerService';

type ActivityType = 'inquiry' | 'offer' | 'escrow' | 'document';

const typeConfig: Record<ActivityType, React.ElementType> = {
  inquiry: Users,
  offer: Handshake,
  escrow: ShieldCheck,
  document: FileCheck,
};

const titleFor = (type: string): string => {
  switch (type) {
    case 'offer':
      return 'New offer received';
    case 'viewing':
      return 'New viewing request';
    case 'transaction':
      return 'Payment update';
    case 'document':
      return 'Document update';
    default:
      return 'Activity';
  }
};

const typeFor = (type: string): ActivityType => {
  switch (type) {
    case 'offer':
      return 'offer';
    case 'viewing':
      return 'inquiry';
    case 'transaction':
      return 'escrow';
    case 'document':
      return 'document';
    default:
      return 'inquiry';
  }
};

interface OwnerActivityFeedProps {
  activity: OwnerDashboard['recentActivity'];
}

export const OwnerActivityFeed = ({ activity }: OwnerActivityFeedProps) => {
  return (
    <ActivityFeedCard
      description="Buyer inquiries, offers, payments, and document updates"
      emptyIcon={ShieldCheck}
      viewAllHref="/owner/activity"
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
