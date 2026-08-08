'use client';

import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, RefreshCw, AlertTriangle, Star, Clock } from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtitle?: string;
  color: string;
  delay: number;
}

const colorClasses = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600 dark:text-blue-400' },
  gold: { bg: 'bg-[#c4a747]/10', icon: 'text-[#c4a747]' },
  green: { bg: 'bg-green-50 dark:bg-green-950/20', icon: 'text-green-600 dark:text-green-400' },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  red: { bg: 'bg-red-50 dark:bg-red-950/20', icon: 'text-red-600 dark:text-red-400' },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
} as const;

const StatCard = ({ icon: Icon, label, value, subtitle, color, delay }: StatCardProps) => {
  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a2a2f] border border-gray-200 dark:border-white/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#c4a747]/5 to-transparent" />

      <div className="relative p-4">
        <div
          className={`inline-flex p-2.5 rounded-xl ${colors.bg} transition-all duration-300 group-hover:scale-110 mb-3`}
        >
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c4a747] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

interface AgentStatsCardsProps {
  todaysTasks: number;
  completedThisWeek: number;
  pendingSync: number;
  overdueTasks: number;
  avgRating: number;
  avgResponseTime: string;
}

export const AgentStatsCards = ({
  todaysTasks,
  completedThisWeek,
  pendingSync,
  overdueTasks,
  avgRating,
  avgResponseTime,
}: AgentStatsCardsProps) => {
  const stats = [
    {
      icon: ClipboardList,
      label: "Today's Tasks",
      value: todaysTasks,
      subtitle: 'Assigned to you',
      color: 'gold',
      delay: 0,
    },
    {
      icon: CheckCircle2,
      label: 'Completed This Week',
      value: completedThisWeek,
      subtitle: 'Inspections & visits',
      color: 'green',
      delay: 0.05,
    },
    {
      icon: RefreshCw,
      label: 'Pending Sync',
      value: pendingSync,
      subtitle: 'Awaiting upload',
      color: 'blue',
      delay: 0.1,
    },
    {
      icon: AlertTriangle,
      label: 'Overdue',
      value: overdueTasks,
      subtitle: 'Needs attention',
      color: 'red',
      delay: 0.15,
    },
    {
      icon: Star,
      label: 'Avg. Rating',
      value: avgRating.toFixed(1),
      subtitle: 'From clients',
      color: 'emerald',
      delay: 0.2,
    },
    {
      icon: Clock,
      label: 'Avg. Response Time',
      value: avgResponseTime,
      subtitle: 'To new tasks',
      color: 'orange',
      delay: 0.25,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
