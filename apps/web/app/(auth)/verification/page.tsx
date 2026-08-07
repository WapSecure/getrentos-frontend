'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { VerificationLeftContent, VerificationRightContent } from '@/components/auth/Verification';
import { AnimatedParticles } from '@/components/ui/AnimatedParticles';
import { useSignup } from '@/hooks/useSignup';
import { ROUTES, getDashboardRoute } from '@/lib/constants/auth';

export type VerificationStep = 'id-select' | 'id-upload' | 'liveness' | 'processing' | 'complete';

export default function VerificationPage() {
  const router = useRouter();
  const { signupData } = useSignup();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('id-select');
  const [selectedIdType, setSelectedIdType] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signupData.isVerified && signupData.selectedRoles.length === 0) {
      router.push(ROUTES.SIGNUP);
    }
  }, [signupData, router]);

  const handleNextStep = (step: VerificationStep) => {
    setCurrentStep(step);
  };

  const handleBack = () => {
    if (currentStep === 'id-upload') {
      setCurrentStep('id-select');
    } else if (currentStep === 'liveness') {
      setCurrentStep('id-upload');
    } else if (currentStep === 'id-select') {
      router.back();
    }
  };

  const handleComplete = () => {
    router.push(getDashboardRoute(signupData.selectedRoles[0]));
  };

  const handleSkip = () => {
    router.push(getDashboardRoute(signupData.selectedRoles[0]));
  };

  // Don't show back button on processing and complete steps
  const showBackButton = currentStep !== 'processing' && currentStep !== 'complete';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0a1a1f] dark:to-[#0d2a2f] flex relative">
      <AnimatedParticles />

      {/* Back Button - Top Left */}
      {showBackButton && (
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {currentStep === 'id-select' ? 'Back to Sign Up' : 'Back'}
          </span>
        </button>
      )}

      <VerificationLeftContent />

      <VerificationRightContent
        currentStep={currentStep}
        selectedIdType={selectedIdType}
        setSelectedIdType={setSelectedIdType}
        idImage={idImage}
        setIdImage={setIdImage}
        error={error}
        setError={setError}
        onNextStep={handleNextStep}
        onBack={handleBack}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </div>
  );
}
