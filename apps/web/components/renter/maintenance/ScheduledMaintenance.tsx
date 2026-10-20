'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Wrench,
  CheckCircle,
  AlertCircle,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { Badge, Button, EmptyState, type BadgeVariant } from '@getrentos/ui';

interface ScheduledMaintenance {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  estimatedDuration: string;
  assignedVendor: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type: 'routine' | 'repair' | 'inspection';
}

interface ScheduledMaintenanceProps {
  schedules: ScheduledMaintenance[];
  onSchedule?: () => void;
}

const statusConfig: Record<
  ScheduledMaintenance['status'],
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  scheduled: { label: 'Scheduled', variant: 'info', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'warning', icon: Wrench },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'danger', icon: AlertCircle },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const ScheduledMaintenance = ({ schedules, onSchedule }: ScheduledMaintenanceProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border flex justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Scheduled Maintenance</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Upcoming and ongoing maintenance</p>
        </div>
        <Button size="sm" variant="ghost" className="gap-1" onClick={onSchedule}>
          <Plus className="w-3 h-3" />
          Schedule
        </Button>
      </div>

      <div className="divide-y divide-border">
        {schedules.length === 0 ? (
          <EmptyState icon={Calendar} title="No scheduled maintenance" size="compact" bare />
        ) : (
          schedules.map((schedule) => {
            const status = statusConfig[schedule.status];
            const StatusIcon = status.icon;

            return (
              <div key={schedule.id} className="p-4 hover:bg-secondary transition-colors">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h4 className="font-medium text-foreground">{schedule.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{schedule.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(schedule.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{schedule.estimatedDuration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        <span>{schedule.assignedVendor}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={status.variant} icon={<StatusIcon className="w-3 h-3" />}>
                    {status.label}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
