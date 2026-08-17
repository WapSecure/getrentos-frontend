'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  MessageCircle,
  Shield,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { EmailSignup } from '@/components/auth/SignupForm/EmailSignup';
import { PhoneSignup } from '@/components/auth/SignupForm/PhoneSignup';
import { OtpVerification } from '@/components/auth/SignupForm/OtpVerification';
import { SignupLeftContent } from '@/components/auth/SignupLeftContent';
import { AnimatedParticles } from '@getrentos/ui';
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

  // If step is 'roles' or 'verification', redirect to those pages
  useEffect(() => {
    if (step === 'roles') {
      window.location.href = ROUTES.ROLE_SELECTION;
    } else if (step === 'verification') {
      window.location.href = ROUTES.VERIFICATION;
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-background flex relative">
      <AnimatedParticles />

      {/* Back Button - Top Left */}
      <button
        onClick={handleBack}
        className="fixed top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-border hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {step === 'otp' ? 'Back to signup' : 'Back'}
        </span>
      </button>

      {/* Start Over Button */}
      <button
        onClick={handleStartOver}
        className="fixed top-6 left-28 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-border hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm"
        aria-label="Start over"
      >
        <RefreshCw className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Start Over</span>
      </button>

      <div className="fixed top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Left Side - Content */}
      <SignupLeftContent />

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-2xl mb-4">
              <Shield className="w-6 h-6 text-white dark:text-background" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {step === 'signup' ? 'Create an account' : 'Verify your identity'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {step === 'signup'
                ? 'Join GetRentos and start your property journey'
                : 'Enter the verification code sent to your device'}
            </p>
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
            {step === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Method Selection */}
                <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-white/10 rounded-xl">
                  <button
                    onClick={() => setMethod(SIGNUP_METHODS.EMAIL)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      method === SIGNUP_METHODS.EMAIL
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    onClick={() => setMethod(SIGNUP_METHODS.PHONE)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      method === SIGNUP_METHODS.PHONE
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Phone
                  </button>
                  <button
                    onClick={() => setMethod(SIGNUP_METHODS.WHATSAPP)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      method === SIGNUP_METHODS.WHATSAPP
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>

                {/* Signup Form */}
                {method === SIGNUP_METHODS.EMAIL ? (
                  <EmailSignup onSubmit={handleSendOtp} isLoading={isLoading} />
                ) : (
                  <PhoneSignup onSubmit={handleSendOtp} isLoading={isLoading} />
                )}
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
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <a
                href={ROUTES.LOGIN}
                className="font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Sign in
              </a>
            </p>
          )}

          {/* Trust Badges for Mobile */}
          <div className="lg:hidden mt-8 pt-6 border-t border-border">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                SOC2 Certified
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                GDPR Compliant
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                24/7 Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
