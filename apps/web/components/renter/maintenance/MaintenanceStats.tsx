'use client';

import { motion } from 'framer-motion';
import { Wrench, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { MaintenanceSummary } from '@/types/maintenance';

interface MaintenanceStatsProps {
  summary: MaintenanceSummary;
}

/** Totals across every request, not just the page on screen. */
export const MaintenanceStats = ({ summary }: MaintenanceStatsProps) => {
  const { total, open, resolved, urgent } = summary;
  const stats = [
    {
      icon: Wrench,
      label: 'Total Requests',
      value: total,
      color: 'text-muted-foreground',
      bg: 'bg-secondary',
    },
    {
      icon: Clock,
      label: 'Open',
      value: open,
      color: 'text-warning',
      bg: 'bg-warning-subtle',
    },
    {
      icon: CheckCircle,
      label: 'Resolved',
      value: resolved,
      color: 'text-success',
      bg: 'bg-success-subtle',
    },
    {
      icon: AlertTriangle,
      label: 'Urgent',
      value: urgent,
      color: 'text-destructive',
      bg: 'bg-destructive-subtle',
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
          className={`${stat.bg} rounded-xl p-4 border border-border`}
        >
          <div className="flex items-center gap-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};
