'use client';

import { CheckCircle, Clock, AlertCircle, TrendingUp, Award, Users } from 'lucide-react';
import type { VerificationItem, Badge, TrustScoreHistoryItem } from '@/types/trust-score';

interface TrustScoreStatsProps {
  trustScore: number;
  verifications: VerificationItem[];
  badges: Badge[];
  history: TrustScoreHistoryItem[];
}

export const TrustScoreStats = ({
  trustScore,
  verifications = [],
  badges = [],
  history = [],
}: TrustScoreStatsProps) => {
  // Every figure here is derived from the account's real data. These cards used
  // to be hardcoded ("4/6", "+12%", "3"), which contradicted the verification
  // list and badge grid right beside them.
  const totalVerifications = verifications.length;
  const verifiedCount = verifications.filter((v) => v.verified).length;
  const pendingCount = totalVerifications - verifiedCount;
  const earnedBadges = badges.filter((b) => b.earned).length;
  // Net movement since the first recorded point: the sum of each change.
  const netChange = history.reduce((sum, item) => sum + item.change, 0);
  const netChangeLabel = `${netChange > 0 ? '+' : ''}${netChange}`;

  const positive = 'text-green-600 dark:text-green-400';
  const negative = 'text-red-600 dark:text-red-400';
  const neutral = 'text-muted-foreground';

  const stats = [
    {
      icon: TrendingUp,
      label: 'Trust Score',
      value: `${trustScore} / 100`,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: CheckCircle,
      label: 'Verifications Complete',
      value: `${verifiedCount}/${totalVerifications}`,
      color: positive,
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Clock,
      label: 'Pending Verifications',
      value: `${pendingCount}`,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: netChange < 0 ? AlertCircle : TrendingUp,
      label: 'Net Score Change',
      value: history.length === 0 ? '—' : netChangeLabel,
      color: netChange > 0 ? positive : netChange < 0 ? negative : neutral,
      bg:
        netChange > 0
          ? 'bg-green-50 dark:bg-green-900/20'
          : netChange < 0
            ? 'bg-red-50 dark:bg-red-900/20'
            : 'bg-secondary',
    },
    {
      icon: Award,
      label: 'Badges Earned',
      value: `${earnedBadges}/${badges.length}`,
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
      {stats.map((stat) => (
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
