'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  Key,
  CalendarDays,
} from 'lucide-react';
import { Alert, Badge } from '@getrentos/ui';

interface ApplicationStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  icon: React.ElementType;
}

interface ApplicationTimelineProps {
  currentStatus: 'submitted' | 'reviewing' | 'approved' | 'move-in' | 'rejected';
  submittedDate?: string;
  estimatedDecisionDate?: string;
}

const getSteps = (status: string): ApplicationStep[] => {
  const baseSteps = [
    {
      id: 'submitted',
      title: 'Application Submitted',
      description: 'Your application has been received',
      icon: FileText,
      status: 'pending' as const,
    },
    {
      id: 'reviewing',
      title: 'Under Review',
      description: 'Landlord is reviewing your application',
      icon: UserCheck,
      status: 'pending' as const,
    },
    {
      id: 'approved',
      title: 'Application Approved',
      description: 'Congratulations! Your application was approved',
      icon: CheckCircle,
      status: 'pending' as const,
    },
    {
      id: 'move-in',
      title: 'Move-In Ready',
      description: 'Complete paperwork and schedule move-in',
      icon: Key,
      status: 'pending' as const,
    },
  ];

  const statusOrder = ['submitted', 'reviewing', 'approved', 'move-in'];
  const currentIndex = statusOrder.indexOf(status);

  return baseSteps.map((step, index) => ({
    ...step,
    status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending',
  }));
};

export const ApplicationTimeline = ({
  currentStatus,
  submittedDate,
  estimatedDecisionDate,
}: ApplicationTimelineProps) => {
  const steps = getSteps(currentStatus);
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = (completedCount / totalSteps) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'current':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Application Timeline</h3>
        <p className="text-xs text-muted-foreground mt-1">Track your application progress</p>
      </div>

      <div className="p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Overall Progress</span>
            <span>
              {completedCount}/{totalSteps} steps
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-3"
            >
              {/* Icon */}
              <div className="relative shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-success-subtle'
                      : step.status === 'current'
                        ? 'bg-primary/20'
                        : 'bg-secondary'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : step.status === 'current' ? (
                    <Clock className="w-4 h-4 text-primary" />
                  ) : (
                    <step.icon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-8 left-1/2 w-0.5 h-8 -translate-x-1/2 ${
                      step.status === 'completed' ? 'bg-success' : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pb-6">
                <div className="flex justify-between items-start gap-2">
                  <h4 className={`text-sm font-semibold ${getStatusColor(step.status)}`}>
                    {step.title}
                  </h4>
                  {step.status === 'current' && <Badge variant="info">In Progress</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>

                {/* Estimated dates */}
                {step.id === 'submitted' && submittedDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted: {new Date(submittedDate).toLocaleDateString()}
                  </p>
                )}
                {step.id === 'reviewing' && estimatedDecisionDate && step.status === 'current' && (
                  <Alert variant="warning" icon={AlertCircle} className="mt-2 px-3 py-2 text-xs">
                    Estimated decision: {new Date(estimatedDecisionDate).toLocaleDateString()}
                  </Alert>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Next Steps */}
        {currentStatus === 'approved' && (
          <Alert variant="success" icon={CalendarDays} title="Next Steps" className="mt-4">
            Schedule your move-in inspection and complete the lease agreement
          </Alert>
        )}

        {currentStatus === 'rejected' && (
          <Alert variant="danger" title="Application Not Approved" className="mt-4">
            Contact the landlord for feedback or continue exploring other properties
          </Alert>
        )}
      </div>
    </motion.div>
  );
};
