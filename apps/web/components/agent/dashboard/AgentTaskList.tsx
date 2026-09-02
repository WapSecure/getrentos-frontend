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
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Today&apos;s Tasks</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your assigned inspections and verification visits
        </p>
      </div>

      <div className="divide-y divide-border">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
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
                className="p-4 flex items-start gap-3 hover:bg-secondary transition-colors"
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-accent'}`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <Icon className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {config.label} · {task.propertyAddress}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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
