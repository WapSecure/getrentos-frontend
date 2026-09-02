'use client';

import { Handshake, CalendarClock, ShieldCheck, Heart } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';
import type { BuyerDashboard } from '@/services/buyerService';

type ActivityType = 'offer' | 'viewing' | 'escrow' | 'saved';

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  offer: { icon: Handshake, bg: 'bg-accent', color: 'text-primary' },
  viewing: {
    icon: CalendarClock,
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    color: 'text-orange-600 dark:text-orange-400',
  },
  escrow: {
    icon: ShieldCheck,
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    color: 'text-blue-600 dark:text-blue-400',
  },
  saved: {
    icon: Heart,
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    color: 'text-purple-600 dark:text-purple-400',
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
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Offers, viewings, escrow, and saved property updates
        </p>
      </div>

      <div className="divide-y divide-border">
        {activity.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
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
    </div>
  );
};
