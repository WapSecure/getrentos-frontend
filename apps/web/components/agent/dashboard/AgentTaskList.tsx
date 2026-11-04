'use client';

import { ClipboardCheck, UserCheck, Home, FileText, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, EmptyState } from '@getrentos/ui';
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
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle>Today&apos;s tasks</CardTitle>
        <CardDescription>Your assigned inspections and verification visits</CardDescription>
      </CardHeader>

      <div className="divide-y divide-border">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No tasks scheduled for today"
            size="compact"
            bare
          />
        ) : (
          tasks.map((task) => {
            const config = typeConfig[task.type];
            const Icon = config.icon;
            const isOverdue = task.status === 'overdue';
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 p-4 transition-colors hover:bg-secondary/60"
              >
                <div
                  className={`shrink-0 rounded-full p-2 ${isOverdue ? 'bg-destructive-subtle' : 'bg-secondary'}`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
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
    </Card>
  );
};
