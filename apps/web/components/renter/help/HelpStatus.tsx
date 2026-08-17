'use client';

import { Activity } from 'lucide-react';

export const HelpStatus = () => {
  return (
    <div className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            GetRentos services are operational
          </span>
        </div>
      </div>
    </div>
  );
};
