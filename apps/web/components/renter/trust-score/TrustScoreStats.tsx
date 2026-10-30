'use client';

import { CheckCircle, Clock, AlertCircle, TrendingUp, Award, Users } from 'lucide-react';
import { StatCard } from '@getrentos/ui';
import { trustBand } from '@/lib/trustScore';
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard
        icon={TrendingUp}
        label="Trust Score"
        value={`${trustScore} / 100`}
        accent="primary"
      />
      <StatCard
        icon={CheckCircle}
        label="Verifications Complete"
        value={`${verifiedCount}/${totalVerifications}`}
        accent="green"
      />
      <StatCard
        icon={Clock}
        label="Pending Verifications"
        value={`${pendingCount}`}
        accent="orange"
      />
      <StatCard
        icon={netChange < 0 ? AlertCircle : TrendingUp}
        label="Net Score Change"
        value={history.length === 0 ? '—' : netChangeLabel}
        accent={netChange > 0 ? 'green' : netChange < 0 ? 'red' : 'blue'}
      />
      <StatCard
        icon={Award}
        label="Badges Earned"
        value={`${earnedBadges}/${badges.length}`}
        accent="orange"
      />
      <StatCard
        icon={Users}
        label="Trust Level"
        value={trustBand(trustScore).label}
        accent="primary"
      />
    </div>
  );
};
