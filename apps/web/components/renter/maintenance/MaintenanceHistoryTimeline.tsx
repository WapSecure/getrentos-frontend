'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, User, Wrench, MessageCircle, AlertCircle } from 'lucide-react';

interface HistoryEvent {
  id: string;
  type: 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'comment' | 'escalated';
  title: string;
  description: string;
  date: string;
  user: string;
}

interface MaintenanceHistoryTimelineProps {
  events: HistoryEvent[];
}

const eventIcons = {
  submitted: { icon: Clock, color: 'text-info', bg: 'bg-info-subtle' },
  assigned: { icon: User, color: 'text-purple', bg: 'bg-purple-subtle' },
  in_progress: { icon: Wrench, color: 'text-warning', bg: 'bg-warning-subtle' },
  resolved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success-subtle' },
  comment: { icon: MessageCircle, color: 'text-muted-foreground', bg: 'bg-secondary' },
  escalated: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive-subtle' },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MaintenanceHistoryTimeline = ({ events }: MaintenanceHistoryTimelineProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Request Timeline</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Complete history of this request</p>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

          <div className="space-y-4">
            {events.map((event, index) => {
              const config = eventIcons[event.type];
              const Icon = config.icon;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-10"
                >
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">by {event.user}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
