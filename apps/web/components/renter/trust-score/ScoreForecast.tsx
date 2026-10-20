'use client';

import { TrendingUp } from 'lucide-react';
import { Alert, Card } from '@getrentos/ui';

interface Verification {
  id: string;
  label: string;
  verified: boolean;
  description: string;
}

// Deterministic factor weights (same weights as ScoreFactors).
const FACTOR_WEIGHTS: Record<string, number> = {
  identity: 15,
  phone: 10,
  email: 8,
  background_check: 15,
  references: 5,
};

interface ScoreForecastProps {
  currentScore: number;
  verifications: Verification[];
}

export const ScoreForecast = ({ currentScore, verifications }: ScoreForecastProps) => {
  const potentialIncrease = verifications.reduce((total, v) => {
    if (v.verified) return total;
    return total + (FACTOR_WEIGHTS[v.id] ?? 0);
  }, 0);
  const forecastScore = Math.min(100, currentScore + potentialIncrease);

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Score Forecast</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Potential score after completing verifications
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Score</p>
            <p className="text-2xl font-bold text-foreground">{currentScore}</p>
          </div>
          <TrendingUp className="w-6 h-6 text-success" aria-hidden="true" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Forecast Score</p>
            <p className="text-2xl font-bold text-success">{forecastScore}</p>
          </div>
        </div>

        {potentialIncrease > 0 ? (
          <Alert
            variant="success"
            icon={TrendingUp}
            title={`Potential increase of +${potentialIncrease} points`}
          >
            Complete pending verifications to reach this score
          </Alert>
        ) : (
          <Alert variant="success">
            All verifications complete: your score is at its potential.
          </Alert>
        )}
      </div>
    </Card>
  );
};
