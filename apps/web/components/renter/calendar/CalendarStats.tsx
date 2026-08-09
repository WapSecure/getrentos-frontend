'use client';

import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { CalendarEvent } from '@/types/calendar';

interface CalendarStatsProps {
  events: CalendarEvent[];
}

export const CalendarStats = ({ events }: CalendarStatsProps) => {
  const total = events.length;
  const upcoming = events.filter((e) => e.status === 'upcoming').length;
  const completed = events.filter((e) => e.status === 'completed').length;
  const cancelled = events.filter((e) => e.status === 'cancelled').length;

  const stats = [
    {
      icon: Calendar,
      label: 'Total Events',
      value: total,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Clock,
      label: 'Upcoming',
      value: upcoming,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: CheckCircle,
      label: 'Completed',
      value: completed,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: AlertCircle,
      label: 'Cancelled',
      value: cancelled,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-border`}>
          <div className="flex items-center gap-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};
