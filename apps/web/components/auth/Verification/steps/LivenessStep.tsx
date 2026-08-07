'use client';

import { ArrowLeft, Camera } from 'lucide-react';
import { VerificationStep } from '@/app/(auth)/verification/page';

interface LivenessStepProps {
  onNextStep: (step: VerificationStep) => void;
  onBack: () => void;
}

export const LivenessStep = ({ onNextStep, onBack }: LivenessStepProps) => {
  const handleStartVerification = () => {
    onNextStep('processing');
    // Simulate processing
    setTimeout(() => {
      onNextStep('complete');
    }, 3000);
  };

  return (
    <div className="text-center space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#c4a747]/10 flex items-center justify-center">
        <Camera className="w-10 h-10 text-[#c4a747]" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Liveness Check</h3>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        For security purposes, we need to verify that you are a real person. Click the button below
        to start the liveness verification.
      </p>

      <button
        onClick={handleStartVerification}
        className="inline-flex items-center gap-2 bg-[#c4a747] text-[#0a1a1f] px-6 py-3 rounded-xl font-semibold hover:bg-[#a88d3a] transition-all"
      >
        <Camera className="w-4 h-4" />
        Start Verification
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-500">
        You&apos;ll need to allow camera access for this step
      </p>
    </div>
  );
};
