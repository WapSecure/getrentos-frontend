'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
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
  lease: ROUTES.RENTER_LEASE,
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
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await renterService.listNotifications();
      if (res.success && res.data) {
        setActivities(
          res.data.slice(0, 5).map((n) => {
            const mapped = iconByType[n.type] || { icon: Bell, color: 'text-gray-500' };
            return {
              id: n.id,
              type: n.type,
              title: n.title,
              time: n.createdAt,
              icon: mapped.icon,
              iconColor: mapped.color,
            };
          })
        );
      }
    };
    load();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">Your latest actions and updates</p>
      </div>

      <div className="divide-y divide-border">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + index * 0.03, duration: 0.3 }}
            className="p-3 hover:bg-secondary transition-colors cursor-pointer"
            onClick={() => router.push(activityRoutes[activity.type])}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-secondary`}>
                <activity.icon className={`w-4 h-4 ${activity.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{activity.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatTimeAgo(activity.time)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-3 border-t border-border text-center">
        <button
          onClick={() => router.push(ROUTES.RENTER_NOTIFICATIONS)}
          className="text-sm text-primary hover:text-primary-hover transition-colors"
        >
          View all activity
        </button>
      </div>
    </motion.div>
  );
};
