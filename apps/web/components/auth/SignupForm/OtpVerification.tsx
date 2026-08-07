/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { AUTH_CONSTANTS } from '@/lib/constants/auth';

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
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
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

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

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
      setOtp(['', '', '', '', '', '']);
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
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#c4a747]/10 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-[#c4a747]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Verify your {method}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We sent a verification code to{' '}
          <span className="font-medium text-gray-900 dark:text-white">{identifier}</span>
        </p>
      </div>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#c4a747] focus:border-transparent transition-all"
            maxLength={1}
          />
        ))}
      </div>

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
            className="inline-flex items-center gap-1 text-sm text-[#c4a747] hover:text-[#a88d3a] transition-colors"
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
        className="w-full flex items-center justify-center gap-2 bg-[#c4a747] text-[#0a1a1f] py-3 rounded-xl font-semibold hover:bg-[#a88d3a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-[#0a1a1f] border-t-transparent rounded-full animate-spin" />
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
