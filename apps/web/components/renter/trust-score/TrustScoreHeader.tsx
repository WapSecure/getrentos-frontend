'use client';

import { Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TrustScoreHeaderProps {
  trustScore: number;
}

export const TrustScoreHeader = ({ trustScore }: TrustScoreHeaderProps) => {
  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Needs Improvement', color: 'text-red-600' };
  };

  const scoreInfo = getScoreLabel(trustScore);

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Trust Score</h1>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${scoreInfo.color} bg-${scoreInfo.color.includes('green') ? 'green' : scoreInfo.color.includes('blue') ? 'blue' : scoreInfo.color.includes('yellow') ? 'yellow' : 'red'}-50 dark:bg-${scoreInfo.color.includes('green') ? 'green' : scoreInfo.color.includes('blue') ? 'blue' : scoreInfo.color.includes('yellow') ? 'yellow' : 'red'}-900/20`}
            >
              <Shield className="w-4 h-4" />
              {scoreInfo.label}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Your trust score determines your credibility on the platform
          </p>
        </div>

        <Button variant="primary" className="gap-2" size="sm">
          <TrendingUp className="w-4 h-4" />
          Improve Score
        </Button>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Higher trust scores unlock more features
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Complete verifications to increase your score
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
