'use client';

import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  UserCheck,
  Home,
  FileText,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import { taskStatusBadges } from '@/lib/statusBadge';
import type { AgentTask, TaskType, TaskPriority } from '@/types/agent';

const typeConfig: Record<TaskType, { icon: React.ElementType; label: string }> = {
  inspection: { icon: ClipboardCheck, label: 'Inspection' },
  verification: { icon: UserCheck, label: 'Verification' },
  valuation: { icon: Home, label: 'Valuation' },
  document_pickup: { icon: FileText, label: 'Document Pickup' },
};

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high: { label: 'High', className: 'text-red-600 dark:text-red-400' },
  medium: { label: 'Medium', className: 'text-yellow-600 dark:text-yellow-400' },
  low: { label: 'Low', className: 'text-muted-foreground' },
};

interface TaskCardProps {
  task: AgentTask;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  delay?: number;
}

export const TaskCard = ({ task, onStart, onComplete, onCancel, delay = 0 }: TaskCardProps) => {
  const type = typeConfig[task.type];
  const TypeIcon = type.icon;
  const status = taskStatusBadges[task.status];
  const priority = priorityConfig[task.priority];
  const isActionable =
    task.status === 'assigned' || task.status === 'in_progress' || task.status === 'overdue';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-accent shrink-0">
            <TypeIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{task.propertyAddress}</p>
          </div>
        </div>
        <Badge variant={status.variant} icon={status.icon && <status.icon className="w-3 h-3" />}>
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-gray-400">Assigned By</p>
          <p className="text-sm font-medium text-foreground truncate">{task.assignedBy}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Priority</p>
          <p className={`text-sm font-medium ${priority.className}`}>{priority.label}</p>
        </div>
      </div>

      <p className="flex items-center gap-1 text-xs text-gray-400 mt-3">
        <Clock className="w-3 h-3" />
        Due {formatDate(task.dueDate)}
      </p>

      {isActionable && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-red-600 dark:text-red-400"
            onClick={onCancel}
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </Button>
          <div className="flex-1" />
          {task.status !== 'in_progress' ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onStart}>
              <PlayCircle className="w-3.5 h-3.5" />
              Start
            </Button>
          ) : (
            <Button variant="primary" size="sm" className="gap-1.5" onClick={onComplete}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Complete
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};
