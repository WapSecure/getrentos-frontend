'use client';

import { Bell, CheckCircle, Clock, AlertCircle, Inbox } from 'lucide-react';
import { Card, EmptyState } from '@getrentos/ui';
import { format } from 'date-fns';
import { humanizeScoreReason } from '@/components/renter/trust-score/reasonLabels';

interface ScoreHistoryItem {
  date: string;
  score: number;
  change: number;
  reason: string;
}

interface ScoreNotificationsProps {
  history: ScoreHistoryItem[];
}

export const ScoreNotifications = ({ history }: ScoreNotificationsProps) => {
  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Score Updates</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Recent activity affecting your score</p>
      </div>

      <div className="divide-y divide-border">
        {history.length === 0 ? (
          <EmptyState icon={Inbox} title="No score activity yet" size="compact" bare />
        ) : (
          history.slice(0, 5).map((item, index) => (
            <div key={index} className="p-3 hover:bg-secondary transition-colors">
              <div className="flex items-start gap-3">
                {item.change > 0 && (
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                )}
                {item.change === 0 && <Clock className="w-4 h-4 text-info mt-0.5 shrink-0" />}
                {item.change < 0 && (
                  <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm text-foreground">
                    {humanizeScoreReason(item.reason)}
                    {item.change !== 0 && (
                      <span className={item.change > 0 ? 'text-success' : 'text-destructive'}>
                        {' '}
                        ({item.change > 0 ? '+' : ''}
                        {item.change})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(item.date), 'MMM d, yyyy')} · Score {item.score}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
