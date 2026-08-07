'use client';

import { motion } from 'framer-motion';
import {
  MessageSquare,
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ApplicationStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  estimatedTime: string;
}

const applicationSteps: ApplicationStep[] = [
  {
    id: '1',
    title: 'Complete Profile',
    description: 'Add your personal information and preferences',
    status: 'completed',
    estimatedTime: '2 min',
  },
  {
    id: '2',
    title: 'Upload Documents',
    description: 'Government ID, proof of income, references',
    status: 'in-progress',
    estimatedTime: '5 min',
  },
  {
    id: '3',
    title: 'Submit Application',
    description: 'Review and submit your rental application',
    status: 'pending',
    estimatedTime: '3 min',
  },
  {
    id: '4',
    title: 'Verification',
    description: 'Landlord reviews your application',
    status: 'pending',
    estimatedTime: '24-48 hours',
  },
];

export const DiscoverAIApplicationAssistant = () => {
  const completedCount = applicationSteps.filter((s) => s.status === 'completed').length;
  const inProgressCount = applicationSteps.filter((s) => s.status === 'in-progress').length;
  const totalSteps = applicationSteps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Application Assistant</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Get personalized help with your rental applications
        </p>
      </div>

      <div className="p-4">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Application Readiness</span>
            <span>
              {completedCount}/{totalSteps} steps completed
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c4a747] rounded-full"
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-4">
          {applicationSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="flex-shrink-0">
                {step.status === 'completed' && (
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                )}
                {step.status === 'in-progress' && (
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-blue-600" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${step.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">{step.estimatedTime}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Tip */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-[#c4a747]/10 to-transparent border border-[#c4a747]/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#c4a747] mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-white">AI Suggestion</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Complete your document upload to increase approval chances by 40%. Landlords prefer
                verified applicants.
              </p>
            </div>
          </div>
        </div>

        <Button variant="primary" size="sm" fullWidth className="mt-4 gap-1">
          Continue Application
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};
