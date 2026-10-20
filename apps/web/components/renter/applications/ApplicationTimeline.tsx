'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, AlertCircle, Home, UserCheck } from 'lucide-react';
import { Alert } from '@getrentos/ui';

interface TimelineStep {
  stage: string;
  date: string;
  completed: boolean;
}

interface ApplicationTimelineProps {
  timeline: TimelineStep[];
  currentStatus: 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
}

// Map status to icon components (declared outside render)
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
      return 'Under Review';
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

  // Get the appropriate icon component based on status
  const StatusIcon = statusIconMap[currentStatus] || Clock;
  const statusColor = statusColorMap[currentStatus] || 'text-muted-foreground';
  const statusLabel = getStatusLabel(currentStatus);

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
          <span className="text-sm font-medium text-foreground capitalize">{statusLabel}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{totalSteps} steps
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-primary rounded-full"
        />
      </div>

      {/* Timeline Steps */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {timeline.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-10"
            >
              <div
                className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-success-subtle' : 'bg-secondary'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-sm font-medium ${
                      step.completed ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.stage}
                  </h4>
                  {step.completed && <span className="text-xs text-success">✓</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.date === 'Pending' ? 'Awaiting confirmation' : step.date}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {currentStatus === 'approved' && (
        <Alert variant="success" icon={Home} title="Congratulations!">
          Your application has been approved. Next steps: Review lease agreement and schedule
          move-in.
        </Alert>
      )}

      {currentStatus === 'rejected' && (
        <Alert variant="danger" icon={AlertCircle} title="Application Not Approved">
          Contact the landlord for feedback or continue exploring other properties.
        </Alert>
      )}

      {currentStatus === 'pending' && (
        <Alert variant="warning" icon={Clock} title="Awaiting Review">
          Your application is being reviewed by the landlord. You&apos;ll be notified of any
          updates.
        </Alert>
      )}

      {currentStatus === 'under_review' && (
        <Alert variant="info" icon={UserCheck} title="Under Review">
          The landlord is reviewing your application. Decisions typically take 2-5 business days.
        </Alert>
      )}
    </div>
  );
};
