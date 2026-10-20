'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@getrentos/ui';
import { TrustScoreHistoryItem } from '@/types/trust-score';
import { humanizeScoreReason } from '@/components/renter/trust-score/reasonLabels';

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
    <Card>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/20"
      >
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">Score History</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Track your trust score changes</p>
        </div>
        <span className="rounded-md p-1 text-muted-foreground" aria-hidden="true">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 divide-y divide-border">
          {history.map((item, index) => (
            <div key={index} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {humanizeScoreReason(item.reason)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{item.score}</span>
                <span
                  className={`text-xs font-medium ${
                    item.change > 0
                      ? 'text-success'
                      : item.change < 0
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                  }`}
                >
                  {item.change > 0 && '+'}
                  {item.change}
                </span>
                {item.change > 0 && <TrendingUp className="w-3 h-3 text-success" />}
                {item.change < 0 && <TrendingDown className="w-3 h-3 text-destructive" />}
                {item.change === 0 && <Minus className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
