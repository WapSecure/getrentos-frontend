'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TrustScoreHistoryItem } from '@/types/trust-score';

interface TrustScoreHistoryProps {
  history: TrustScoreHistoryItem[];
}

export const TrustScoreHistory = ({ history }: TrustScoreHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Score History</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track your trust score changes
          </p>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 divide-y divide-gray-200 dark:divide-white/10">
          {history.map((item, index) => (
            <div key={index} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.reason}</p>
                <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.score}
                </span>
                <span
                  className={`text-xs font-medium ${
                    item.change > 0
                      ? 'text-green-600'
                      : item.change < 0
                        ? 'text-red-600'
                        : 'text-gray-500'
                  }`}
                >
                  {item.change > 0 && '+'}
                  {item.change}
                </span>
                {item.change > 0 && <TrendingUp className="w-3 h-3 text-green-600" />}
                {item.change < 0 && <TrendingDown className="w-3 h-3 text-red-600" />}
                {item.change === 0 && <Minus className="w-3 h-3 text-gray-500" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
