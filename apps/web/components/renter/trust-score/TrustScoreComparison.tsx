'use client';

import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Alert, Card } from '@getrentos/ui';

interface TrustScoreComparisonProps {
  currentScore: number;
  averageScore: number;
}

export const TrustScoreComparison = ({ currentScore, averageScore }: TrustScoreComparisonProps) => {
  const difference = currentScore - averageScore;

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Score Comparison</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">How you compare to other renters</p>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your Score</p>
            <p className="text-2xl font-bold text-foreground">{currentScore}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="text-2xl font-bold text-foreground">{averageScore}</p>
          </div>
        </div>

        <Alert
          variant={difference > 0 ? 'success' : difference < 0 ? 'danger' : 'neutral'}
          icon={difference > 0 ? TrendingUp : difference < 0 ? TrendingDown : Minus}
        >
          {difference > 0 && `You're ${Math.abs(difference)} points above average`}
          {difference < 0 && `You're ${Math.abs(difference)} points below average`}
          {difference === 0 && `You're at the average score`}
        </Alert>
      </div>
    </Card>
  );
};
