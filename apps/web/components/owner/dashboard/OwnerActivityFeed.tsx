'use client';

import { Users, Handshake, ShieldCheck, FileCheck } from '@sureground/icons';
import { Card, EmptyState } from '@sureground/ui';
import { formatRelativeTime } from '@/lib/format';
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
    <Card>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Buyer inquiries, offers, payments, and document updates
        </p>
      </div>

      <div className="divide-y divide-border">
        {activity.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No activity yet" size="compact" bare />
        ) : (
          activity.map((item) => {
            const type = typeFor(item.type);
            const Icon = typeConfig[type];
            return (
              <div
                key={item.id}
                className="p-4 flex items-start gap-3 hover:bg-secondary transition-colors"
              >
                <div className="shrink-0 rounded-full bg-secondary p-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
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
