'use client';

import { Users, Handshake, ShieldCheck, FileCheck } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';

type ActivityType = 'inquiry' | 'offer' | 'escrow' | 'document';

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
    type: 'inquiry',
    title: 'New buyer inquiry',
    description: 'A verified buyer requested details on Ocean View Towers',
    time: '2026-08-07T13:10:00.000Z',
  },
  {
    id: '2',
    type: 'offer',
    title: 'New offer received',
    description: 'Emeka Chukwu offered ₦85,000,000 for Palm Court Villa',
    time: '2026-08-07T09:30:00.000Z',
  },
  {
    id: '3',
    type: 'escrow',
    title: 'Escrow milestone reached',
    description: 'Ownership documents verified for Lekki Waterfront Duplex',
    time: '2026-08-06T11:00:00.000Z',
  },
  {
    id: '4',
    type: 'document',
    title: 'Verification document approved',
    description: 'Title deed for Ocean View Towers passed compliance review',
    time: '2026-08-05T16:20:00.000Z',
  },
];

const typeConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  inquiry: {
    icon: Users,
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    color: 'text-purple-600 dark:text-purple-400',
  },
  offer: { icon: Handshake, bg: 'bg-accent', color: 'text-primary' },
  escrow: {
    icon: ShieldCheck,
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    color: 'text-blue-600 dark:text-blue-400',
  },
  document: {
    icon: FileCheck,
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
};

export const OwnerActivityFeed = () => {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Buyer inquiries, offers, escrow, and document updates
        </p>
      </div>

      <div className="divide-y divide-border">
        {activityItems.map((item) => {
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
        })}
      </div>
    </div>
  );
};
