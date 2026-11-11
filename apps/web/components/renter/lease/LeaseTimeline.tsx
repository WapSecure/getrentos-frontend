'use client';

import { Card, Timeline } from '@sureground/ui';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar } from '@sureground/icons';

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
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Lease timeline</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Key events and milestones</p>
        </div>

        <div className="p-4">
          <Timeline
            variant="feed"
            titleAs="h4"
            aria-label="Lease timeline"
            items={lease.timeline.map((event, index) => ({
              id: `${index}`,
              title: event.event,
              date: formatDate(event.date),
              description: event.description,
              state: 'done',
              icon: <CheckCircle className="w-4 h-4 text-success" />,
            }))}
          />
        </div>
      </Card>
    </motion.div>
  );
};
