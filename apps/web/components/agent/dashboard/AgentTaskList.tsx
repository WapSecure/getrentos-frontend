'use client';

import { ClipboardCheck, UserCheck, Home, FileText, Clock, AlertTriangle } from '@sureground/icons';
import { Badge, Card, CardDescription, CardHeader, CardTitle, EmptyState } from '@sureground/ui';
import { formatDate } from '@/lib/format';
import type { AgentTask, TaskType } from '@/types/agent';

const typeConfig: Record<TaskType, { icon: React.ElementType; label: string }> = {
  inspection: { icon: ClipboardCheck, label: 'Inspection' },
  verification: { icon: UserCheck, label: 'Verification' },
  valuation: { icon: Home, label: 'Valuation' },
  document_pickup: { icon: FileText, label: 'Document pickup' },
};

interface AgentTaskListProps {
  tasks: AgentTask[];
}

export const AgentTaskList = ({ tasks }: AgentTaskListProps) => {
  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle as="h2">Upcoming tasks</CardTitle>
        <CardDescription>Your next inspections and visits, soonest first</CardDescription>
      </CardHeader>

      <div className="divide-y divide-border">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No upcoming tasks"
            description="New visits will appear here once they are assigned to you."
            size="compact"
            bare
          />
        ) : (
          tasks.map((task) => {
            const config = typeConfig[task.type];
            const Icon = config.icon;
            const isOverdue = task.status === 'overdue';
            return (
              <div key={task.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isOverdue ? 'bg-destructive-subtle text-destructive' : 'bg-primary/10 text-primary'}`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {config.label} · {task.propertyAddress}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  {isOverdue && <Badge variant="danger">Overdue</Badge>}
                  <p className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    <Clock className="h-3 w-3" aria-hidden="true" />
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
