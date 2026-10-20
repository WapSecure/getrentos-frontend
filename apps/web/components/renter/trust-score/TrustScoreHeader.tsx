'use client';

import { Shield, TrendingUp } from 'lucide-react';
import { Badge, Button, type BadgeVariant } from '@getrentos/ui';
import { trustBand } from '@/lib/trustScore';

interface TrustScoreHeaderProps {
  trustScore: number;
}

export const TrustScoreHeader = ({ trustScore }: TrustScoreHeaderProps) => {
  const scoreInfo = trustBand(trustScore);
  const bandVariant: BadgeVariant =
    trustScore >= 90
      ? 'success'
      : trustScore >= 70
        ? 'info'
        : trustScore >= 50
          ? 'warning'
          : 'danger';

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Trust Score</h1>
            <Badge variant={bandVariant} icon={<Shield className="w-4 h-4" aria-hidden="true" />}>
              {scoreInfo.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Your trust score determines your credibility on the platform
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<TrendingUp className="w-4 h-4" />}>
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
