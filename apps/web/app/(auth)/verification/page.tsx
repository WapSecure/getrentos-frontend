'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { VerificationLeftContent, VerificationRightContent } from '@/components/auth/Verification';
import { AnimatedParticles } from '@/components/ui/AnimatedParticles';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSignup } from '@/hooks/useSignup';
import { ROUTES, getDashboardRoute } from '@/lib/constants/auth';
import { kycService, ID_TYPE_TO_BACKEND } from '@/services/kycService';

export type VerificationStep = 'id-select' | 'id-upload' | 'liveness' | 'processing' | 'complete';

export default function VerificationPage() {
  const router = useRouter();
  const { signupData, otpReference, createAccount } = useSignup();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('id-select');
  const [selectedIdType, setSelectedIdType] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!signupData.isVerified && signupData.selectedRoles.length === 0) {
      router.push(ROUTES.SIGNUP);
    }
  }, [signupData, router]);

  useEffect(() => {
    if (currentStep !== 'processing') return;
    if (submittingRef.current) return; // guard against effect re-runs
    if (!idFile || !selectedIdType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('Missing identity document. Please try again.');
      setCurrentStep('id-upload');
      return;
    }
    if (!otpReference) {
      setError('Your verification session expired. Please start over.');
      setCurrentStep('id-upload');
      return;
    }
    submittingRef.current = true;
    let cancelled = false;
    (async () => {
      const response = await kycService.preVerify({
        reference: otpReference,
        document: idFile,
        selfie: selfieFile ?? undefined,
        documentType: ID_TYPE_TO_BACKEND[selectedIdType],
      });
      if (cancelled) return;

      if (!response.success || !response.data) {
        setError(response.message || 'Verification failed. Please try again.');
        setCurrentStep('id-upload');
        return;
      }

      const { status } = response.data;
      if (status === 'REJECTED') {
        // Face does not match the identity document — block and let the
        // user retry with a correct document/selfie.
        setError(response.data.message || 'The selfie does not match your identity document.');
        setCurrentStep('id-upload');
        return;
      }

      // APPROVED (auto-verified) or PENDING_REVIEW (ambiguous → manual) both
      // proceed to account creation; the account carries the status.
      await createAccount();
      if (cancelled) return;
      setCurrentStep('complete');
    })();

    return () => {
      cancelled = true;
      submittingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, idFile, selfieFile, selectedIdType, otpReference]);

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

  const handleSkip = async () => {
    // Skipping still creates the account (PENDING_REVIEW on the backend) so
    // the signup isn't lost — the user can verify later from their dashboard.
    await createAccount();
    router.push(getDashboardRoute(signupData.selectedRoles[0]));
  };

  // Don't show back button on processing and complete steps
  const showBackButton = currentStep !== 'processing' && currentStep !== 'complete';

  return (
    <div className="min-h-screen bg-background flex relative">
      <AnimatedParticles />

      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Back Button - Top Left */}
      {showBackButton && (
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-border hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm"
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
        onIdFileChange={setIdFile}
        onSelfieCapture={setSelfieFile}
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
