/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { AUTH_CONSTANTS } from '@/lib/constants/auth';
import { OtpInput } from '@/components/auth/OtpInput';

interface OtpVerificationProps {
  identifier: string;
  method: 'email' | 'phone';
  onSubmit: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
}

export const OtpVerification = ({
  identifier,
  method,
  onSubmit,
  onResend,
  isLoading,
}: OtpVerificationProps) => {
  const [otp, setOtp] = useState<string[]>(Array(AUTH_CONSTANTS.OTP_LENGTH).fill(''));
  const [timeLeft, setTimeLeft] = useState(AUTH_CONSTANTS.OTP_EXPIRY_MINUTES * 60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [timeLeft]);

  // Update canResend when timer expires
  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleSubmit = () => {
    const otpValue = otp.join('');
    if (otpValue.length === AUTH_CONSTANTS.OTP_LENGTH) {
      onSubmit(otpValue);
    }
  };

  const handleResend = async () => {
    if (canResend) {
      await onResend();
      setTimeLeft(AUTH_CONSTANTS.OTP_EXPIRY_MINUTES * 60);
      setCanResend(false);
      setOtp(Array(AUTH_CONSTANTS.OTP_LENGTH).fill(''));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Verify your {method}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We sent a verification code to{' '}
          <span className="font-medium text-foreground">{identifier}</span>
        </p>
      </div>

      {/* OTP Inputs */}
      <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

      {/* Timer & Resend */}
      <div className="text-center">
        {!canResend ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Resend code in {formatTime(timeLeft)}
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Resend code
          </button>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={otp.join('').length !== AUTH_CONSTANTS.OTP_LENGTH || isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Verify & Continue
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </motion.button>
    </div>
  );
};
