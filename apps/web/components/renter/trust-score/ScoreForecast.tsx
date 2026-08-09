'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreForecastProps {
  currentScore: number;
}

export const ScoreForecast = ({ currentScore }: ScoreForecastProps) => {
  const forecastScore = Math.min(100, currentScore + 15);
  const potentialIncrease = forecastScore - currentScore;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
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
          <TrendingUp className="w-6 h-6 text-green-500" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Forecast Score</p>
            <p className="text-2xl font-bold text-green-600">{forecastScore}</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              Potential increase of +{potentialIncrease} points
            </span>
          </div>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            Complete pending verifications to reach this score
          </p>
        </div>
      </div>
    </div>
  );
};
