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
      color: 'text-info',
      bg: 'bg-info-subtle',
    },
    {
      icon: Clock,
      label: 'Upcoming',
      value: upcoming,
      color: 'text-warning',
      bg: 'bg-warning-subtle',
    },
    {
      icon: CheckCircle,
      label: 'Completed',
      value: completed,
      color: 'text-success',
      bg: 'bg-success-subtle',
    },
    {
      icon: AlertCircle,
      label: 'Cancelled',
      value: cancelled,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border border-border`}>
          <div className="flex items-center gap-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className={`text-2xl font-semibold tracking-[-0.03em] ${stat.color} mt-1`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};
