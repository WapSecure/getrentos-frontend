'use client';

import { Handshake, CalendarClock, ShieldCheck, Heart } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, EmptyState } from '@getrentos/ui';
import { formatRelativeTime } from '@/lib/format';
import type { BuyerDashboard } from '@/services/buyerService';

type ActivityType = 'offer' | 'viewing' | 'escrow' | 'saved';

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  offer: { icon: Handshake, bg: 'bg-accent', color: 'text-primary' },
  viewing: {
    icon: CalendarClock,
    bg: 'bg-warning-subtle',
    color: 'text-warning',
  },
  escrow: {
    icon: ShieldCheck,
    bg: 'bg-info-subtle',
    color: 'text-info',
  },
  saved: {
    icon: Heart,
    bg: 'bg-secondary',
    color: 'text-foreground',
  },
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
    <Card className="rounded-2xl">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle as="h3">Recent Activity</CardTitle>
        <CardDescription>Offers, viewings, payments, and saved property updates</CardDescription>
      </CardHeader>

      <div className="divide-y divide-border">
        {activity.length === 0 ? (
          <EmptyState icon={Heart} title="No activity yet" size="compact" bare />
        ) : (
          activity.map((item) => {
            const config = typeConfig[typeFor(item.type)];
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className="p-4 flex items-start gap-3 hover:bg-secondary transition-colors"
              >
                <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{titleFor(item.type)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(item.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
