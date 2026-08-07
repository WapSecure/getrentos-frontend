'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
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
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Maintenance Analytics</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Performance insights</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-xs text-gray-500">Resolution Rate</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{resolutionRate}%</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-gray-500">Avg Response</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{avgResponseTime}h</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-500" />
            <span className="text-xs text-gray-500">Urgent Requests</span>
          </div>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{urgentRequests}</p>
        </div>

        {urgentRequests > 0 && (
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300">
              ⚠️ {urgentRequests} urgent request{urgentRequests > 1 ? 's' : ''} need attention
            </p>
          </div>
        )}

        {resolutionRate > 80 && total > 0 && (
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-300">
              ✅ Great resolution rate! Keep up the good work.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
