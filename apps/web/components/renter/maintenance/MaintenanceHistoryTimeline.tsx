'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  User,
  Wrench,
  Calendar,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';

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
  submitted: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  assigned: { icon: User, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  in_progress: { icon: Wrench, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  resolved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  comment: { icon: MessageCircle, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-white/5' },
  escalated: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
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
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Request Timeline</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Complete history of this request
        </p>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

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
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </h4>
                      <span className="text-xs text-gray-500">{formatDate(event.date)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">by {event.user}</p>
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
