'use client';

import { motion } from 'framer-motion';
import { Wrench, Clock, UserCheck, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceStatsProps {
  requests: MaintenanceRequest[];
}

export const MaintenanceStats = ({ requests }: MaintenanceStatsProps) => {
  const total = requests.length;
  const open = requests.filter((r) => r.status !== 'resolved').length;
  const resolved = requests.filter((r) => r.status === 'resolved').length;
  const urgent = requests.filter((r) => r.priority === 'urgent').length;
  const inProgress = requests.filter((r) => r.status === 'in_progress').length;

  const stats = [
    {
      icon: Wrench,
      label: 'Total Requests',
      value: total,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-white/5',
    },
    {
      icon: Clock,
      label: 'Open',
      value: open,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: CheckCircle,
      label: 'Resolved',
      value: resolved,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: AlertTriangle,
      label: 'Urgent',
      value: urgent,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`${stat.bg} rounded-xl p-4 border border-gray-200 dark:border-white/10`}
        >
          <div className="flex items-center gap-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</span>
          </div>
          <p className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};
