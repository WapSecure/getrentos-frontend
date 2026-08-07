'use client';

import { CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

const factors = [
  { label: 'Identity Verified', impact: '+15', status: 'positive' },
  { label: 'Phone Verified', impact: '+10', status: 'positive' },
  { label: 'Email Verified', impact: '+8', status: 'positive' },
  { label: 'Property Verified', impact: '+20', status: 'pending' },
  { label: 'Background Check', impact: '+15', status: 'pending' },
  { label: 'References Added', impact: '+5', status: 'pending' },
];

export const ScoreFactors = () => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Score Factors</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          What impacts your trust score
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {factors.map((factor, index) => (
          <div key={index} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {factor.status === 'positive' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {factor.status === 'pending' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
              {factor.status === 'negative' && <XCircle className="w-4 h-4 text-red-500" />}
              <span className="text-sm text-gray-700 dark:text-gray-300">{factor.label}</span>
            </div>
            <span
              className={`text-sm font-semibold ${
                factor.status === 'positive'
                  ? 'text-green-600'
                  : factor.status === 'pending'
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {factor.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
