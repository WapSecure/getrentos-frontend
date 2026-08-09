'use client';

import { motion } from 'framer-motion';
import { Wrench, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MaintenanceHeaderProps {
  onReport: () => void;
}

export const MaintenanceHeader = ({ onReport }: MaintenanceHeaderProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
          <p className="text-muted-foreground mt-1">Report and track maintenance issues</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" className="gap-2" size="sm" onClick={onReport}>
            <Plus className="w-4 h-4" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* SLA Promise Banner */}
      <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              SLA Response Promise
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Urgent issues responded within 2 hours • Standard issues within 24 hours
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
