'use client';

import { ClipboardCheck, UserCheck, Home, FileText, Clock, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { AgentTask, TaskType } from '@/types/agent';

const typeConfig: Record<TaskType, { icon: React.ElementType; label: string }> = {
  inspection: { icon: ClipboardCheck, label: 'Inspection' },
  verification: { icon: UserCheck, label: 'Verification' },
  valuation: { icon: Home, label: 'Valuation' },
  document_pickup: { icon: FileText, label: 'Document Pickup' },
};

interface AgentTaskListProps {
  tasks: AgentTask[];
}

export const AgentTaskList = ({ tasks }: AgentTaskListProps) => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Today&apos;s Tasks</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Your assigned inspections and verification visits
        </p>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No tasks scheduled for today
          </p>
        ) : (
          tasks.map((task) => {
            const config = typeConfig[task.type];
            const Icon = config.icon;
            const isOverdue = task.status === 'overdue';
            return (
              <div
                key={task.id}
                className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-[#c4a747]/10'}`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <Icon className="w-4 h-4 text-[#c4a747]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {config.label} · {task.propertyAddress}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due {formatDate(task.dueDate)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
