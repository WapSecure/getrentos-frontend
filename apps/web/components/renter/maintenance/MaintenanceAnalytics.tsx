'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { Alert } from '@getrentos/ui';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceAnalyticsProps {
  requests: MaintenanceRequest[];
}

export const MaintenanceAnalytics = ({ requests }: MaintenanceAnalyticsProps) => {
  const total = requests.length;
  const resolved = requests.filter((r) => r.status === 'resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const urgentRequests = requests.filter((r) => r.priority === 'urgent').length;
  const avgResponseTime =
    total > 0
      ? Math.round(
          requests.reduce((sum, r) => {
            const diff = r.resolvedAt
              ? (new Date(r.resolvedAt).getTime() - new Date(r.createdAt).getTime()) /
                (1000 * 60 * 60)
              : (new Date().getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
            return sum + diff;
          }, 0) / total
        )
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Maintenance Analytics</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Performance insights</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-success" />
              <span className="text-xs text-muted-foreground">Resolution Rate</span>
            </div>
            <p className="text-lg font-bold text-foreground">{resolutionRate}%</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-info" />
              <span className="text-xs text-muted-foreground">Avg Response</span>
            </div>
            <p className="text-lg font-bold text-foreground">{avgResponseTime}h</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-destructive" />
            <span className="text-xs text-muted-foreground">Urgent Requests</span>
          </div>
          <p className="text-lg font-bold text-destructive">{urgentRequests}</p>
        </div>

        {urgentRequests > 0 && (
          <Alert variant="danger">
            {urgentRequests} urgent request{urgentRequests > 1 ? 's' : ''} need attention
          </Alert>
        )}

        {resolutionRate > 80 && total > 0 && (
          <Alert variant="success">Great resolution rate! Keep up the good work.</Alert>
        )}
      </div>
    </motion.div>
  );
};
