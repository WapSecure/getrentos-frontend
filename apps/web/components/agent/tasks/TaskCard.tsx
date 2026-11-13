'use client';

import {
  ClipboardCheck,
  UserCheck,
  Home,
  FileText,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
} from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import {
  RecordActions,
  RecordFacts,
  RecordIconTile,
  recordCardClass,
} from '@/components/shared/records/RecordParts';
import { formatDate } from '@/lib/format';
import { taskStatusBadges } from '@/lib/statusBadge';
import type { AgentTask, TaskType, TaskPriority } from '@/types/agent';

const typeConfig: Record<TaskType, { icon: React.ElementType; label: string }> = {
  inspection: { icon: ClipboardCheck, label: 'Inspection' },
  verification: { icon: UserCheck, label: 'Verification' },
  valuation: { icon: Home, label: 'Valuation' },
  document_pickup: { icon: FileText, label: 'Document pickup' },
};

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high: { label: 'High', className: 'text-destructive' },
  medium: { label: 'Medium', className: 'text-warning' },
  low: { label: 'Low', className: 'text-muted-foreground' },
};

interface TaskCardProps {
  task: AgentTask;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  isUpdating?: boolean;
}

export const TaskCard = ({
  task,
  onStart,
  onComplete,
  onCancel,
  isUpdating = false,
}: TaskCardProps) => {
  const type = typeConfig[task.type];
  const TypeIcon = type.icon;
  const status = taskStatusBadges[task.status];
  const priority = priorityConfig[task.priority];
  const isActionable =
    task.status === 'assigned' || task.status === 'in_progress' || task.status === 'overdue';

  return (
    <article className={recordCardClass()}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <RecordIconTile icon={TypeIcon} />
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{task.propertyAddress}</p>
          </div>
        </div>
        <Badge
          variant={status.variant}
          icon={status.icon && <status.icon className="w-3 h-3" />}
          className="shrink-0"
        >
          {status.label}
        </Badge>
      </div>

      <RecordFacts
        facts={[
          { label: 'Assigned by', value: task.assignedBy },
          {
            label: 'Priority',
            value: <span className={priority.className}>{priority.label}</span>,
          },
        ]}
      />

      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
        <Clock className="w-3 h-3" aria-hidden="true" />
        Due {formatDate(task.dueDate)}
      </p>

      {isActionable && (
        <RecordActions className="flex-nowrap">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            icon={<XCircle className="w-3.5 h-3.5" />}
            onClick={onCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <div className="flex-1" />
          {task.status !== 'in_progress' ? (
            <Button
              variant="outline"
              size="sm"
              icon={<PlayCircle className="w-3.5 h-3.5" />}
              onClick={onStart}
              isLoading={isUpdating}
            >
              Start
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={onComplete}
              isLoading={isUpdating}
            >
              {task.type === 'inspection' || task.type === 'verification'
                ? 'Continue work'
                : 'Complete'}
            </Button>
          )}
        </RecordActions>
      )}
    </article>
  );
};
