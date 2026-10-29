'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock } from 'lucide-react';
import { Alert } from '@getrentos/ui';
import { Application } from '@/types/renter';

interface ApplicationAnalyticsProps {
  applications: Application[];
}

export const ApplicationAnalytics = ({ applications }: ApplicationAnalyticsProps) => {
  const total = applications.length;
  const approved = applications.filter((a) => a.status === 'approved').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;
  const pending = applications.filter(
    (a) => a.status === 'pending' || a.status === 'under_review'
  ).length;

  const successRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Application Analytics</h3>
        <p className="text-xs text-muted-foreground">Insights about your applications</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Success Rate Ring */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="6"
                strokeDasharray={`${(successRate / 100) * 201} 201`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground">{successRate}%</span>
              <span className="text-xs text-muted-foreground">Success</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">Approved</span>
              <span className="font-medium text-foreground ml-auto">{approved}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Rejected</span>
              <span className="font-medium text-foreground ml-auto">{rejected}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium text-foreground ml-auto">{pending}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
          <div className="p-2 rounded-lg bg-secondary">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary" />
              <span className="text-xs text-foreground/75">Pending</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{pending}</p>
          </div>
          <div className="p-2 rounded-lg bg-secondary">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-xs text-foreground/75">Total</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{total}</p>
          </div>
        </div>

        {successRate < 50 && total > 0 && (
          <Alert variant="warning" title="Insight" className="px-3 py-2 text-xs">
            Your success rate is below 50%. Consider improving your application documents.
          </Alert>
        )}

        {successRate >= 70 && total > 0 && (
          <Alert variant="success" title="Great Job!" className="px-3 py-2 text-xs">
            Your application success rate is excellent. Keep up the good work!
          </Alert>
        )}
      </div>
    </motion.div>
  );
};
