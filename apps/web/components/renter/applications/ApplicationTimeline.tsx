'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Home, UserCheck } from '@sureground/icons';
import { Alert, Timeline } from '@sureground/ui';

interface TimelineStep {
  stage: string;
  date: string;
  completed: boolean;
}

interface ApplicationTimelineProps {
  timeline: TimelineStep[];
  currentStatus: 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
}

const statusIconMap: Record<string, React.ElementType> = {
  pending: Clock,
  under_review: UserCheck,
  approved: CheckCircle,
  rejected: AlertCircle,
  withdrawn: AlertCircle,
};

const statusColorMap: Record<string, string> = {
  pending: 'text-warning',
  under_review: 'text-info',
  approved: 'text-success',
  rejected: 'text-destructive',
  withdrawn: 'text-muted-foreground',
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'under_review':
      return 'Under review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return status;
  }
};

export const ApplicationTimeline = ({ timeline, currentStatus }: ApplicationTimelineProps) => {
  const completedCount = timeline.filter((step) => step.completed).length;
  const totalSteps = timeline.length;
  const progress = (completedCount / totalSteps) * 100;

  const StatusIcon = statusIconMap[currentStatus] || Clock;
  const statusColor = statusColorMap[currentStatus] || 'text-muted-foreground';
  const statusLabel = getStatusLabel(currentStatus);
  // While the landlord is still deciding, the first unfinished step is the one in progress.
  const inReview = currentStatus === 'pending' || currentStatus === 'under_review';
  const firstOpen = timeline.findIndex((step) => !step.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
          <span className="text-sm font-medium text-foreground capitalize">{statusLabel}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{totalSteps} steps
        </span>
      </div>

      <div className="h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-primary rounded-full"
        />
      </div>

      <Timeline
        titleAs="h4"
        aria-label="Application steps"
        items={timeline.map((step, index) => ({
          id: `${index}`,
          title: step.stage,
          description: step.date === 'Pending' ? 'Awaiting confirmation' : step.date,
          state: step.completed ? 'done' : index === firstOpen && inReview ? 'current' : 'pending',
        }))}
      />

      {currentStatus === 'approved' && (
        <Alert variant="success" icon={Home} title="Congratulations!">
          Your application has been approved. Next steps: Review lease agreement and schedule
          move-in.
        </Alert>
      )}

      {currentStatus === 'rejected' && (
        <Alert variant="danger" icon={AlertCircle} title="Application not approved">
          Contact the landlord for feedback or continue exploring other properties.
        </Alert>
      )}

      {currentStatus === 'pending' && (
        <Alert variant="warning" icon={Clock} title="Awaiting review">
          Your application is being reviewed by the landlord. You&apos;ll be notified of any
          updates.
        </Alert>
      )}

      {currentStatus === 'under_review' && (
        <Alert variant="info" icon={UserCheck} title="Under review">
          The landlord is reviewing your application. Decisions typically take 2-5 business days.
        </Alert>
      )}
    </div>
  );
};
