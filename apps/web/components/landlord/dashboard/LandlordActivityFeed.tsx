'use client';

import { CreditCard, Wrench, CalendarClock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';

type ActivityType = 'payment' | 'maintenance' | 'lease';

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
    type: 'payment',
    title: 'Rent payment received',
    description: 'Adaeze Okafor paid ₦450,000 for Sunrise Apartments, Unit 3B',
    time: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: '2',
    type: 'maintenance',
    title: 'Maintenance request updated',
    description: 'Plumbing repair at Modern Downtown Loft marked in progress',
    time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: '3',
    type: 'lease',
    title: 'Lease expiring soon',
    description: 'Chuka Nwosu’s lease at Palm Court Residences ends in 14 days',
    time: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
  },
  {
    id: '4',
    type: 'payment',
    title: 'Rent payment received',
    description: 'Ifeoma Bello paid ₦380,000 for Palm Court Residences, Unit 1A',
    time: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  payment: {
    icon: CreditCard,
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  maintenance: {
    icon: Wrench,
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    color: 'text-purple-600 dark:text-purple-400',
  },
  lease: {
    icon: CalendarClock,
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    color: 'text-orange-600 dark:text-orange-400',
  },
};

export const LandlordActivityFeed = () => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Payments, maintenance, and lease updates
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
