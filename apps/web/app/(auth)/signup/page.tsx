'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MessageCircle, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { EmailSignup } from '@/components/auth/SignupForm/EmailSignup';
import { PhoneSignup } from '@/components/auth/SignupForm/PhoneSignup';
import { OtpVerification } from '@/components/auth/SignupForm/OtpVerification';
import { ReferralCodeField } from '@/components/auth/SignupForm/ReferralCodeField';
import { SignupLeftContent } from '@/components/auth/SignupLeftContent';
import { AuthMethodTabs } from '@/components/auth/AuthMethodTabs';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@getrentos/ui';
import { useSignup } from '@/hooks/useSignup';
import { SIGNUP_METHODS, SignupMethod, ROUTES } from '@/lib/constants/auth';

export default function SignupPage() {
  const [method, setMethod] = useState<SignupMethod>(SIGNUP_METHODS.EMAIL);
  const {
    signupData,
    step,
    isLoading,
    error,
    sendOtp,
    verifyOtp,
    resendOtp,
    setStep,
    resetSignup,
  } = useSignup();

  const handleSendOtp = async (identifier: string) => {
    await sendOtp(identifier, method);
  };

  const handleVerifyOtp = async (otp: string) => {
    await verifyOtp(otp);
  };

  const handleResendOtp = async () => {
    await resendOtp();
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('signup');
    } else if (step === 'signup') {
      window.history.back();
    }
  };

  const handleStartOver = () => {
    resetSignup();
    window.location.href = ROUTES.SIGNUP;
  };

  // If step is 'roles', redirect to role selection.
  useEffect(() => {
    if (step === 'roles') {
      window.location.href = ROUTES.ROLE_SELECTION;
    }
  }, [step]);

  return (
    <main className="relative flex min-h-screen bg-background">
      <button
        onClick={handleBack}
        className="fixed left-4 top-4 z-30 flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card/90 px-3 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 sm:left-6 sm:top-6"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>{step === 'otp' ? 'Back to signup' : 'Back'}</span>
      </button>

      <div className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      {/* Left Side - Content */}
      <SignupLeftContent />

      {/* Right Side - Form */}
      <section className="relative z-10 flex w-full items-center justify-center px-4 py-20 sm:px-8 lg:w-1/2 lg:px-12 lg:py-16">
        <div className="w-full max-w-[32rem] rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-9 dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.7)]">
          <div className="mb-8">
            <div className="mb-6 flex justify-center lg:hidden">
              <Logo size="md" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  {step === 'signup' ? 'Join GetRentos' : 'One final step'}
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {step === 'signup' ? 'Create an account' : 'Verify your identity'}
                </h1>
              </div>
              {step === 'otp' && (
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Start over
                </button>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {step === 'signup'
                ? 'Create one secure account for every part of your property journey.'
                : 'Enter the verification code we sent to your device.'}
            </p>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Method Selection */}
                <div className="mb-7">
                  <AuthMethodTabs
                    label="Choose a signup method"
                    value={method}
                    onChange={setMethod}
                    tabs={[
                      { value: SIGNUP_METHODS.EMAIL, label: 'Email', icon: Mail },
                      { value: SIGNUP_METHODS.PHONE, label: 'Phone', icon: Phone },
                      { value: SIGNUP_METHODS.WHATSAPP, label: 'WhatsApp', icon: MessageCircle },
                    ]}
                  />
                </div>

                {/* Signup Form */}
                {method === SIGNUP_METHODS.EMAIL ? (
                  <EmailSignup onSubmit={handleSendOtp} isLoading={isLoading} />
                ) : (
                  <PhoneSignup onSubmit={handleSendOtp} isLoading={isLoading} />
                )}

                <div className="mt-5">
                  <Suspense fallback={null}>
                    <ReferralCodeField />
                  </Suspense>
                </div>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <OtpVerification
                  identifier={
                    method === SIGNUP_METHODS.EMAIL
                      ? signupData.email || ''
                      : signupData.phone || ''
                  }
                  method={method}
                  onSubmit={handleVerifyOtp}
                  onResend={handleResendOtp}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Link - only show on signup step */}
          {step === 'signup' && (
            <p className="mt-7 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a
                href={ROUTES.LOGIN}
                className="font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Sign in
              </a>
            </p>
          )}

          {/* Trust Badges for Mobile */}
          <div className="mt-8 border-t border-border pt-6 lg:hidden">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                Secure by design
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                Identity verification
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                24/7 Support
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
