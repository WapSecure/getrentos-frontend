'use client';

import { UserPlus, CalendarClock, Handshake, Wallet } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';

type ActivityType = 'lead' | 'viewing' | 'offer' | 'commission';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
}

const activityItems: ActivityItem[] = [
  {
    id: '1',
    type: 'lead',
    title: 'New lead assigned',
    description: 'A buyer inquired about Ocean View Towers',
    time: '2026-08-08T09:20:00.000Z',
  },
  {
    id: '2',
    type: 'viewing',
    title: 'Viewing confirmed',
    description: 'Tour for Palm Court Villa confirmed for Aug 10, 11am',
    time: '2026-08-07T15:40:00.000Z',
  },
  {
    id: '3',
    type: 'offer',
    title: 'Offer submitted on behalf of client',
    description: 'Countered a buyer offer for Ikeja GRA Townhouse',
    time: '2026-08-06T13:00:00.000Z',
  },
  {
    id: '4',
    type: 'commission',
    title: 'Commission paid',
    description: 'Your commission for Surulere Family Duplex has been paid',
    time: '2026-08-06T10:00:00.000Z',
  },
];

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
  offer: { icon: Handshake, bg: 'bg-[#c4a747]/10', color: 'text-[#c4a747]' },
  commission: {
    icon: Wallet,
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
};

export const RealtorActivityFeed = () => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Leads, viewings, offers, and commission updates
        </p>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {activityItems.map((item) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(item.time)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
