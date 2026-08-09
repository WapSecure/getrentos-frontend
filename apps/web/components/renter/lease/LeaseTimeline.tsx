'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Calendar } from 'lucide-react';

interface Lease {
  timeline: {
    date: string;
    event: string;
    description: string;
  }[];
}

interface LeaseTimelineProps {
  lease: Lease;
}

export const LeaseTimeline = ({ lease }: LeaseTimelineProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Lease Timeline</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Key events and milestones</p>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          <div className="space-y-6">
            {lease.timeline.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-10"
              >
                <div className="absolute left-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground">{event.event}</h4>
                    <span className="text-xs text-gray-500">{formatDate(event.date)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
