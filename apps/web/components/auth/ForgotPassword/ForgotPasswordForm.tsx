'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RequestStep } from './steps/RequestStep';
import { OtpStep } from './steps/OtpStep';
import { ResetStep } from './steps/ResetStep';

interface ForgotPasswordFormProps {
  onSuccess: () => void;
  showToast: (message: string, variant: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ForgotPasswordForm = ({ onSuccess, showToast }: ForgotPasswordFormProps) => {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'otp' | 'reset'>('request');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!identifier) {
      showToast(`Please enter your ${method} address`, 'error');
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStep('otp');
    setIsLoading(false);
    showToast(`Verification code sent to your ${method}`, 'success');
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      showToast('Please enter the 6-digit verification code', 'error');
      return;
    }
    setStep('reset');
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    onSuccess();
  };

  const handleBack = () => {
    if (step === 'otp') setStep('request');
    else if (step === 'reset') setStep('otp');
    else router.back();
  };

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="lg:hidden flex items-center gap-2 text-sm text-gray-500 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Mobile Header */}
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] rounded-2xl mb-4">
            <Shield className="w-6 h-6 text-white dark:text-[#0a1a1f]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We&apos;ll help you get back into your account
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'request' && (
            <motion.div
              key="request"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <RequestStep
                method={method}
                setMethod={setMethod}
                identifier={identifier}
                setIdentifier={setIdentifier}
              />
              <Button
                onClick={handleSendCode}
                isLoading={isLoading}
                variant="primary"
                size="lg"
                className="w-full mt-6"
              >
                Send Reset Code
              </Button>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <OtpStep
                method={method}
                identifier={identifier}
                otp={otp}
                setOtp={setOtp}
                onBack={() => setStep('request')}
              />
              <Button onClick={handleVerifyOtp} variant="primary" size="lg" className="w-full mt-6">
                Verify Code
              </Button>
            </motion.div>
          )}

          {step === 'reset' && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResetStep
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
              />
              <Button
                onClick={handleResetPassword}
                isLoading={isLoading}
                variant="primary"
                size="lg"
                className="w-full mt-6"
              >
                Reset Password
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
