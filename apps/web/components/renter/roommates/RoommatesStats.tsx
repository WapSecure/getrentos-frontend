'use client';

import { Users, UserCheck, UserX, UserPlus } from 'lucide-react';

interface Roommate {
  id: string;
  status: 'active' | 'pending' | 'inactive';
}

interface RoommatesStatsProps {
  roommates: Roommate[];
}

export const RoommatesStats = ({ roommates }: RoommatesStatsProps) => {
  const total = roommates.length;
  const active = roommates.filter((r) => r.status === 'active').length;
  const pending = roommates.filter((r) => r.status === 'pending').length;
  const inactive = roommates.filter((r) => r.status === 'inactive').length;

  const stats = [
    {
      icon: Users,
      label: 'Total Roommates',
      value: total,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: UserCheck,
      label: 'Active',
      value: active,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: UserPlus,
      label: 'Pending',
      value: pending,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: UserX,
      label: 'Inactive',
      value: inactive,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`${stat.bg} rounded-xl p-4 border border-gray-200 dark:border-white/10`}
        >
          <div className="flex items-center gap-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</span>
          </div>
          <p className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};
