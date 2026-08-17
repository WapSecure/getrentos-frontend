'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { RequestStep } from './steps/RequestStep';
import { OtpStep } from './steps/OtpStep';
import { ResetStep } from './steps/ResetStep';
import { authService } from '@/services/authService';
import { useMutation } from '@tanstack/react-query';

interface ForgotPasswordFormProps {
  onSuccess: () => void;
  showToast: (message: string, variant: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ForgotPasswordForm = ({ onSuccess, showToast }: ForgotPasswordFormProps) => {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'otp' | 'reset'>('request');
  const [method, setMethod] = useState<'email' | 'phone' | 'whatsapp'>('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [reference, setReference] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sendCodeMutation = useMutation({
    mutationFn: () => authService.sendOtp(identifier, method, 'password_reset'),
  });
  const resendCodeMutation = useMutation({
    mutationFn: (otpReference: string) => authService.resendOtp(otpReference),
  });
  const verifyOtpMutation = useMutation({
    mutationFn: ({ otpCode, otpReference }: { otpCode: string; otpReference: string }) =>
      authService.verifyOtp(otpCode, otpReference),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: ({ otpReference, password }: { otpReference: string; password: string }) =>
      authService.resetPassword(otpReference, password),
  });

  const methodLabel = method === 'whatsapp' ? 'WhatsApp' : method;

  const handleSendCode = async () => {
    if (!identifier) {
      showToast(
        method === 'email' ? 'Please enter your email address' : 'Please enter your phone number',
        'error'
      );
      return;
    }
    setIsLoading(true);
    const response = await sendCodeMutation.mutateAsync();
    setIsLoading(false);

    if (response.success && response.data) {
      setReference(response.data.reference);
      setStep('otp');
      showToast(`Verification code sent to your ${methodLabel}`, 'success');
    } else {
      showToast(response.message || 'Failed to send verification code', 'error');
    }
  };

  const handleResendCode = async () => {
    if (!reference) return;
    const response = await resendCodeMutation.mutateAsync(reference);
    if (response.success) {
      showToast(`Verification code resent to your ${methodLabel}`, 'success');
    } else {
      showToast(response.message || 'Failed to resend code', 'error');
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      showToast('Please enter the 6-digit verification code', 'error');
      return;
    }
    if (!reference) {
      showToast('Your session expired. Please start over.', 'error');
      setStep('request');
      return;
    }

    setIsLoading(true);
    const response = await verifyOtpMutation.mutateAsync({
      otpCode: otpValue,
      otpReference: reference,
    });
    setIsLoading(false);

    if (response.success && response.data?.verified) {
      setStep('reset');
    } else {
      showToast(response.message || 'Invalid verification code', 'error');
    }
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
    if (!reference) {
      showToast('Your session expired. Please start over.', 'error');
      setStep('request');
      return;
    }

    setIsLoading(true);
    const response = await resetPasswordMutation.mutateAsync({
      otpReference: reference,
      password: newPassword,
    });
    setIsLoading(false);

    if (response.success) {
      onSuccess();
    } else {
      showToast(response.message || 'Failed to reset password', 'error');
    }
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
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-2xl mb-4">
            <Shield className="w-6 h-6 text-white dark:text-background" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
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
                onResend={handleResendCode}
              />
              <Button
                onClick={handleVerifyOtp}
                isLoading={isLoading}
                variant="primary"
                size="lg"
                className="w-full mt-6"
              >
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
