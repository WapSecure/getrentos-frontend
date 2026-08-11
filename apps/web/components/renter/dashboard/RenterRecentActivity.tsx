'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, Heart, CheckCircle, TrendingUp, FileText, MessageCircle } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

interface Activity {
  id: string;
  type: 'application' | 'saved' | 'approved' | 'score' | 'message' | 'payment';
  title: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'application',
    title: 'Application submitted for Modern Loft',
    time: '2024-06-07T10:30:00',
    icon: FileText,
    iconColor: 'text-blue-500',
  },
  {
    id: '2',
    type: 'saved',
    title: 'Saved Spacious Townhouse',
    time: '2024-06-06T14:20:00',
    icon: Heart,
    iconColor: 'text-pink-500',
  },
  {
    id: '3',
    type: 'approved',
    title: 'Application approved for Victorian Home',
    time: '2024-06-04T09:15:00',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  {
    id: '4',
    type: 'score',
    title: 'Trust score increased to 87',
    time: '2024-06-03T16:45:00',
    icon: TrendingUp,
    iconColor: 'text-primary',
  },
  {
    id: '5',
    type: 'message',
    title: 'New message from Landlord about maintenance',
    time: '2024-06-02T11:00:00',
    icon: MessageCircle,
    iconColor: 'text-purple-500',
  },
];

const activityRoutes: Record<Activity['type'], string> = {
  application: '/renter/applications',
  saved: '/renter/saved',
  approved: '/renter/applications',
  score: '/renter/trust-score',
  message: '/renter/messages',
  payment: '/renter/payments',
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
