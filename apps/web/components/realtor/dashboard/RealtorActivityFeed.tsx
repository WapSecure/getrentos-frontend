'use client';

import { useQuery } from '@tanstack/react-query';
import { UserPlus, CalendarClock, Handshake, Wallet, Inbox } from 'lucide-react';
import { Card, EmptyState, ListSkeleton } from '@getrentos/ui';
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
  lead: { icon: UserPlus, bg: 'bg-info-subtle', color: 'text-info' },
  viewing: { icon: CalendarClock, bg: 'bg-warning-subtle', color: 'text-warning' },
  offer: { icon: Handshake, bg: 'bg-accent', color: 'text-primary' },
  commission: { icon: Wallet, bg: 'bg-success-subtle', color: 'text-success' },
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
    <Card>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Leads, viewings, offers, and commission updates
        </p>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <ListSkeleton rows={3} label="Loading activity" className="rounded-none border-0" />
        ) : items.length === 0 ? (
          <EmptyState icon={Inbox} title="No activity yet" size="compact" bare />
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(item.time)}
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
