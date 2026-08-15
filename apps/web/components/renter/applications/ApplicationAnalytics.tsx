'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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

  // Calculate average response time (mock - in production, use actual dates)
  const avgResponseTime = '3.2 days';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Application Analytics</h3>
        <p className="text-xs text-gray-500">Insights about your applications</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Success Rate Ring */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="6"
                className="dark:stroke-gray-700"
              />
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
              <span className="text-xs text-gray-500">Success</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Approved</span>
              <span className="font-medium text-foreground ml-auto">{approved}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Rejected</span>
              <span className="font-medium text-foreground ml-auto">{rejected}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium text-foreground ml-auto">{pending}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary" />
              <span className="text-xs text-gray-500">Avg Response</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{avgResponseTime}</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{total}</p>
          </div>
        </div>

        {/* Insight */}
        {successRate < 50 && total > 0 && (
          <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">Insight</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                  Your success rate is below 50%. Consider improving your application documents.
                </p>
              </div>
            </div>
          </div>
        )}

        {successRate >= 70 && total > 0 && (
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-green-800 dark:text-green-300">Great Job!</p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                  Your application success rate is excellent. Keep up the good work!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
