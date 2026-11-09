'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, BarChart3 } from '@sureground/icons';
import { Alert } from '@sureground/ui';
import type { MaintenanceSummary } from '@/types/maintenance';

interface MaintenanceAnalyticsProps {
  summary: MaintenanceSummary;
}

/** Figures across every request, not just the page on screen. */
export const MaintenanceAnalytics = ({ summary }: MaintenanceAnalyticsProps) => {
  const resolutionRate =
    summary.total > 0 ? Math.round((summary.resolved / summary.total) * 100) : 0;
  const urgentRequests = summary.urgent;
  const avgResponseTime = summary.avgResponseHours;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Maintenance analytics</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Performance insights</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-success" />
              <span className="text-xs text-muted-foreground">Resolution rate</span>
            </div>
            <p className="text-lg font-bold text-foreground">{resolutionRate}%</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-info" />
              <span className="text-xs text-muted-foreground">Avg response</span>
            </div>
            <p className="text-lg font-bold text-foreground">{avgResponseTime}h</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-destructive" />
            <span className="text-xs text-muted-foreground">Urgent requests</span>
          </div>
          <p className="text-lg font-bold text-destructive">{urgentRequests}</p>
        </div>

        {urgentRequests > 0 && (
          <Alert variant="danger">
            {urgentRequests} urgent request{urgentRequests > 1 ? 's' : ''} need attention
          </Alert>
        )}

        {resolutionRate > 80 && summary.total > 0 && (
          <Alert variant="success">Great resolution rate! Keep up the good work.</Alert>
        )}
      </div>
    </motion.div>
  );
};
