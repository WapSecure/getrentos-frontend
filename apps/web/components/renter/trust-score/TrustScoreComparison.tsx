'use client';

import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrustScoreComparisonProps {
  currentScore: number;
}

export const TrustScoreComparison = ({ currentScore }: TrustScoreComparisonProps) => {
  const averageScore = 65;
  const difference = currentScore - averageScore;

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Score Comparison</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          How you compare to other renters
        </p>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Score</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentScore}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageScore}</p>
          </div>
        </div>

        <div
          className={`p-3 rounded-lg ${
            difference > 0
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : difference < 0
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
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
                    : 'text-gray-700 dark:text-gray-300'
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
