'use client';

import { ShieldCheck, Gavel, AlertTriangle, UserPlus } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';

type ActivityType = 'verification' | 'dispute' | 'fraud' | 'signup';

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
    type: 'verification',
    title: 'New verification request',
    description: 'Segun Alabi submitted property documents for review',
    time: '2026-08-08T09:20:00.000Z',
  },
  {
    id: '2',
    type: 'dispute',
    title: 'Dispute escalated',
    description: 'Escrow dispute on Banana Island Penthouse needs attention',
    time: '2026-08-07T15:40:00.000Z',
  },
  {
    id: '3',
    type: 'fraud',
    title: 'Fraud alert flagged',
    description: 'Unusual login pattern detected on a buyer account',
    time: '2026-08-06T11:00:00.000Z',
  },
  {
    id: '4',
    type: 'signup',
    title: 'New realtor onboarded',
    description: 'Chidinma Nwosu completed license verification',
    time: '2026-08-05T16:20:00.000Z',
  },
];

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  verification: { icon: ShieldCheck, bg: 'bg-[#c4a747]/10', color: 'text-[#c4a747]' },
  dispute: {
    icon: Gavel,
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    color: 'text-orange-600 dark:text-orange-400',
  },
  fraud: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-950/20',
    color: 'text-red-600 dark:text-red-400',
  },
  signup: {
    icon: UserPlus,
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    color: 'text-blue-600 dark:text-blue-400',
  },
};

export const AdminActivityFeed = () => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Verifications, disputes, fraud alerts, and signups
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
