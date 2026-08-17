'use client';

import { useQuery } from '@tanstack/react-query';
import { UserPlus, CalendarClock, Handshake, Wallet, Inbox } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';
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

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  lead: {
    icon: UserPlus,
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    color: 'text-purple-600 dark:text-purple-400',
  },
  viewing: {
    icon: CalendarClock,
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    color: 'text-orange-600 dark:text-orange-400',
  },
  offer: { icon: Handshake, bg: 'bg-accent', color: 'text-primary' },
  commission: {
    icon: Wallet,
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
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
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Leads, viewings, offers, and commission updates
        </p>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading activity…</p>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          items.map((item) => {
            const config = typeConfig[item.type];
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
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(item.time)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
