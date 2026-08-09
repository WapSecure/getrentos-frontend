'use client';

import { CheckCircle, Clock, AlertCircle, TrendingUp, Award, Users } from 'lucide-react';

interface TrustScoreStatsProps {
  trustScore: number;
}

export const TrustScoreStats = ({ trustScore }: TrustScoreStatsProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const stats = [
    {
      icon: CheckCircle,
      label: 'Verifications Complete',
      value: '4/6',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Clock,
      label: 'Pending Verifications',
      value: '2',
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: AlertCircle,
      label: 'Required Actions',
      value: '1',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      icon: TrendingUp,
      label: 'Score Increase',
      value: '+12%',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Award,
      label: 'Badges Earned',
      value: '3',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      icon: Users,
      label: 'Trust Level',
      value: trustScore >= 70 ? 'Verified' : 'Standard',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
