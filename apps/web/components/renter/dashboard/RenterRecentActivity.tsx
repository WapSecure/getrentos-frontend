'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Activity as ActivityIcon,
  ArrowRight,
  Clock,
  Heart,
  CheckCircle,
  TrendingUp,
  FileText,
  MessageCircle,
  Wrench,
  Bell,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

type ActivityType = 'application' | 'message' | 'payment' | 'maintenance' | 'lease' | 'system';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
}

const iconByType: Record<ActivityType, { icon: React.ElementType; color: string }> = {
  application: { icon: FileText, color: 'text-blue-500' },
  message: { icon: MessageCircle, color: 'text-purple-500' },
  payment: { icon: TrendingUp, color: 'text-primary' },
  maintenance: { icon: Wrench, color: 'text-orange-500' },
  lease: { icon: Heart, color: 'text-pink-500' },
  system: { icon: CheckCircle, color: 'text-green-500' },
};

const activityRoutes: Record<ActivityType, string> = {
  application: ROUTES.RENTER_APPLICATIONS,
  message: ROUTES.RENTER_MESSAGES,
  payment: ROUTES.RENTER_PAYMENTS,
  maintenance: ROUTES.RENTER_MAINTENANCE,
  lease: `${ROUTES.RENTER_HOME}?tab=lease`,
  system: ROUTES.RENTER_NOTIFICATIONS,
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

export const RenterRecentActivity = () => {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: [...renterKeys.notifications, { page: 1, pageSize: 5 }],
    queryFn: () => unwrap(renterService.listNotifications({ page: 1, pageSize: 5 })),
  });
  const activities: Activity[] = (data?.items ?? []).slice(0, 5).map((n) => {
    const mapped = iconByType[n.type] || { icon: Bell, color: 'text-muted-foreground' };
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      time: n.createdAt,
      icon: mapped.icon,
      iconColor: mapped.color,
    };
  });

  if (activities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Latest updates
          </p>
          <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Important changes across your renter account.
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ActivityIcon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-2 p-3">
        {activities.map((activity, index) => (
          <motion.button
            type="button"
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + index * 0.03, duration: 0.3 }}
            className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            onClick={() => router.push(activityRoutes[activity.type])}
          >
            <div className="rounded-xl border border-border/70 bg-background p-2.5">
              <activity.icon className={`h-4 w-4 ${activity.iconColor}`} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{activity.title}</p>
              <div className="mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(activity.time)}
                </span>
              </div>
            </div>
            <ArrowRight
              className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </motion.button>
        ))}
      </div>

      <div className="border-t border-border/70 p-3 text-center">
        <button
          type="button"
          onClick={() => router.push(ROUTES.RENTER_NOTIFICATIONS)}
          className="min-h-10 rounded-lg px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          View all activity
        </button>
      </div>
    </motion.div>
  );
};
