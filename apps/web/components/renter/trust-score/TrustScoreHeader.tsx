'use client';

import { Shield, TrendingUp } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { trustBand } from '@/lib/trustScore';

interface TrustScoreHeaderProps {
  trustScore: number;
}

export const TrustScoreHeader = ({ trustScore }: TrustScoreHeaderProps) => {
  const scoreInfo = trustBand(trustScore);

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

      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Higher trust scores unlock more features
            </p>
            <p className="text-xs text-muted-foreground">
              Complete verifications to increase your score
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
