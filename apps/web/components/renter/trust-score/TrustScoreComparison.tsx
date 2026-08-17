'use client';

import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrustScoreComparisonProps {
  currentScore: number;
  averageScore: number;
}

export const TrustScoreComparison = ({ currentScore, averageScore }: TrustScoreComparisonProps) => {
  const difference = currentScore - averageScore;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
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

        <div
          className={`p-3 rounded-lg ${
            difference > 0
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : difference < 0
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-800 border border-border'
          }`}
        >
          <div className="flex items-center gap-2">
            {difference > 0 && <TrendingUp className="w-4 h-4 text-green-600" />}
            {difference < 0 && <TrendingDown className="w-4 h-4 text-red-600" />}
            {difference === 0 && <Minus className="w-4 h-4 text-gray-500" />}
            <span
              className={`text-sm font-medium ${
                difference > 0
                  ? 'text-green-800 dark:text-green-300'
                  : difference < 0
                    ? 'text-red-800 dark:text-red-300'
                    : 'text-foreground'
              }`}
            >
              {difference > 0 && `You're ${Math.abs(difference)} points above average`}
              {difference < 0 && `You're ${Math.abs(difference)} points below average`}
              {difference === 0 && `You're at the average score`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
