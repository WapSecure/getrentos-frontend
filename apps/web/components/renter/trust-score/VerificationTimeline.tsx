'use client';

import { useState } from 'react';
import { Check, Clock, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@getrentos/ui';
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
    <Card>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring/20"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Verification Timeline</h3>
            <p className="text-xs text-muted-foreground">
              {timelineItems.filter((t) => t.status === 'completed').length} of{' '}
              {timelineItems.length} complete
            </p>
          </div>
        </div>
        <span className="rounded-md p-1 text-muted-foreground" aria-hidden="true">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-4">
              {timelineItems.map((item) => (
                <div key={item.id} className="relative pl-10">
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      item.status === 'completed' ? 'bg-success-subtle' : 'bg-secondary'
                    }`}
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
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
                        <Check className="w-3 h-3 text-success" aria-label="Complete" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
