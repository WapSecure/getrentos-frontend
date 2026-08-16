'use client';

import { useState } from 'react';
import { Clock, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { VerificationItem } from '@/types/trust-score';

interface VerificationTimelineProps {
  verifications: VerificationItem[];
}

export const VerificationTimeline = ({ verifications }: VerificationTimelineProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const timelineItems = verifications.map((v) => ({
    id: v.id,
    event: v.label,
    date: v.date || 'Pending',
    status: v.verified ? 'completed' : ('pending' as const),
  }));

  const formatDate = (dateString: string) => {
    if (dateString === 'Pending') return 'Awaiting action';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Verification Timeline</h3>
            <p className="text-xs text-gray-500">
              {timelineItems.filter((t) => t.status === 'completed').length} of{' '}
              {timelineItems.length} complete
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-4">
              {timelineItems.map((item, index) => (
                <div key={item.id} className="relative pl-10">
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      item.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-medium ${
                          item.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {item.event}
                      </h4>
                      {item.status === 'completed' && (
                        <span className="text-xs text-green-600">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
