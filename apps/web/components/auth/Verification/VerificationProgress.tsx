'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Circle, IdCard, Upload, Camera, ShieldCheck } from 'lucide-react';
import { VerificationStep } from '@/app/(auth)/verification/page';

interface VerificationProgressProps {
  currentStep: VerificationStep;
}

const steps = [
  { id: 'id-select' as const, label: 'Select ID', icon: IdCard },
  { id: 'id-upload' as const, label: 'Upload ID', icon: Upload },
  { id: 'liveness' as const, label: 'Liveness Check', icon: Camera },
  { id: 'complete' as const, label: 'Complete', icon: ShieldCheck },
];

export const VerificationProgress = ({ currentStep }: VerificationProgressProps) => {
  const getStepStatus = (stepId: VerificationStep) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  // Don't show progress on processing step
  if (currentStep === 'processing') return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex-1 relative">
              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                    status === 'completed' ? 'bg-[#c4a747]' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ width: 'calc(100% - 2rem)', left: 'calc(50% + 1rem)' }}
                />
              )}

              {/* Step Circle */}
              <div className="flex flex-col items-center relative z-10">
                <motion.div
                  initial={false}
                  animate={{
                    scale: status === 'current' ? 1.1 : 1,
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    status === 'completed'
                      ? 'bg-[#c4a747] text-white'
                      : status === 'current'
                        ? 'bg-[#c4a747]/20 border-2 border-[#c4a747] text-[#c4a747]'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </motion.div>
                <span
                  className={`text-xs mt-2 text-center ${
                    status === 'current'
                      ? 'text-[#c4a747] font-medium'
                      : status === 'completed'
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
