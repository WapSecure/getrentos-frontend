'use client';

import { Handshake, CalendarClock, ShieldCheck, Heart } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';

type ActivityType = 'offer' | 'viewing' | 'escrow' | 'saved';

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
    type: 'offer',
    title: 'Offer countered',
    description: 'The owner of Palm Court Villa sent a counter offer of ₦96,500,000',
    time: '2026-08-07T10:15:00.000Z',
  },
  {
    id: '2',
    type: 'viewing',
    title: 'Viewing confirmed',
    description: 'Your viewing for Ocean View Towers is confirmed for Aug 9, 2pm',
    time: '2026-08-07T07:30:00.000Z',
  },
  {
    id: '3',
    type: 'escrow',
    title: 'Escrow milestone reached',
    description: 'Ownership verification completed for Surulere Family Duplex',
    time: '2026-08-06T12:00:00.000Z',
  },
  {
    id: '4',
    type: 'saved',
    title: 'Price drop on saved property',
    description: 'Lekki Waterfront Duplex reduced its asking price by ₦2,000,000',
    time: '2026-08-05T16:20:00.000Z',
  },
];

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  offer: { icon: Handshake, bg: 'bg-[#c4a747]/10', color: 'text-[#c4a747]' },
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

export const BuyerActivityFeed = () => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Offers, viewings, escrow, and saved property updates
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
