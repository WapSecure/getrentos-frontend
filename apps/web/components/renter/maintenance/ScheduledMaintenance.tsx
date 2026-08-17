'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, Wrench, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@getrentos/ui';

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

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Wrench },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
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
      <div className="p-4 border-b border-border flex justify-between items-center">
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
          <div className="p-8 text-center">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No scheduled maintenance</p>
          </div>
        ) : (
          schedules.map((schedule) => {
            const status = statusConfig[schedule.status];
            const StatusIcon = status.icon;

            return (
              <div key={schedule.id} className="p-4 hover:bg-secondary transition-colors">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h4 className="font-medium text-foreground">{schedule.title}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{schedule.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
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
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
