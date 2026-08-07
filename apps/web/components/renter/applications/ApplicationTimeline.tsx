'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, AlertCircle, Home, UserCheck } from 'lucide-react';

interface TimelineStep {
  stage: string;
  date: string;
  completed: boolean;
}

interface ApplicationTimelineProps {
  timeline: TimelineStep[];
  currentStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
}

// Map status to icon components (declared outside render)
const statusIconMap: Record<string, React.ElementType> = {
  pending: Clock,
  under_review: UserCheck,
  approved: CheckCircle,
  rejected: AlertCircle,
};

const statusColorMap: Record<string, string> = {
  pending: 'text-yellow-500',
  under_review: 'text-blue-500',
  approved: 'text-green-500',
  rejected: 'text-red-500',
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
  const statusColor = statusColorMap[currentStatus] || 'text-gray-500';
  const statusLabel = getStatusLabel(currentStatus);

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
            {statusLabel}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {completedCount}/{totalSteps} steps
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-[#c4a747] rounded-full"
        />
      </div>

      {/* Timeline Steps */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

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
                  step.completed
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-sm font-medium ${
                      step.completed
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.stage}
                  </h4>
                  {step.completed && <span className="text-xs text-green-600">✓</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {step.date === 'Pending' ? 'Awaiting confirmation' : step.date}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {currentStatus === 'approved' && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-2">
            <Home className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Congratulations!
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                Your application has been approved. Next steps: Review lease agreement and schedule
                move-in.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStatus === 'rejected' && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Application Not Approved
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                Contact the landlord for feedback or continue exploring other properties.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStatus === 'pending' && (
        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Awaiting Review
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                Your application is being reviewed by the landlord. You&apos;ll be notified of any
                updates.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStatus === 'under_review' && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Under Review</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                The landlord is reviewing your application. Decisions typically take 2-5 business
                days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
