'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { IdSelectionStep } from './steps/IdSelectionStep';
import { IdUploadStep } from './steps/IdUploadStep';
import { LivenessStep } from './steps/LivenessStep';
import { ProcessingStep } from './steps/ProcessingStep';
import { CompleteStep } from './steps/CompleteStep';
import { VerificationProgress } from './VerificationProgress';
import { VerificationStep } from '@/app/(auth)/verification/page';

interface VerificationRightContentProps {
  currentStep: VerificationStep;
  selectedIdType: string | null;
  setSelectedIdType: (id: string | null) => void;
  idImage: string | null;
  setIdImage: (image: string | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  onNextStep: (step: VerificationStep) => void;
  onBack: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

export const VerificationRightContent = ({
  currentStep,
  selectedIdType,
  setSelectedIdType,
  idImage,
  setIdImage,
  error,
  setError,
  onNextStep,
  onBack,
  onComplete,
  onSkip,
}: VerificationRightContentProps) => {
  const renderStep = () => {
    switch (currentStep) {
      case 'id-select':
        return (
          <IdSelectionStep
            setSelectedIdType={setSelectedIdType}
            onNextStep={onNextStep}
            onSkip={onSkip}
          />
        );
      case 'id-upload':
        return (
          <IdUploadStep
            selectedIdType={selectedIdType}
            idImage={idImage}
            setIdImage={setIdImage}
            setError={setError}
            onNextStep={onNextStep}
            onBack={onBack}
          />
        );
      case 'liveness':
        return <LivenessStep onNextStep={onNextStep} onBack={onBack} />;
      case 'processing':
        return <ProcessingStep />;
      case 'complete':
        return <CompleteStep onComplete={onComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-md">
        {/* Mobile Header */}
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-2xl mb-4">
            <Shield className="w-6 h-6 text-white dark:text-background" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Identity Verification</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Verify your identity to unlock full platform access
          </p>
        </div>

        {/* Desktop Progress Bar - hidden on mobile */}
        <div className="hidden lg:block">
          <VerificationProgress currentStep={currentStep} />
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
