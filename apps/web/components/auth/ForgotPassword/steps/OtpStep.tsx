'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface OtpStepProps {
  method: 'email' | 'phone';
  identifier: string;
  otp: string;
  setOtp: (value: string) => void;
  onBack: () => void;
  onResend: () => void | Promise<void>;
}

export const OtpStep = ({ method, identifier, otp, setOtp, onBack, onResend }: OtpStepProps) => {
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleResend = async () => {
    await onResend();
    setTimeLeft(300);
    setCanResend(false);
  };

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;
    const newOtp = otp.split('');
    newOtp[index] = value;
    setOtp(newOtp.join(''));
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const otpArray = otp.padEnd(6, '').split('').slice(0, 6);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#c4a747]/10 flex items-center justify-center"
        >
          <CheckCircle className="w-8 h-8 text-[#c4a747]" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Verify Your {method}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We sent a verification code to <span className="font-medium">{identifier}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            value={otpArray[index] || ''}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            className="w-12 h-12 text-center text-xl font-semibold border rounded-lg bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#c4a747] focus:border-transparent transition-all"
            maxLength={1}
          />
        ))}
      </div>

      <div className="text-center">
        {!canResend ? (
          <p className="text-sm text-gray-500">Resend code in {formatTime(timeLeft)}</p>
        ) : (
          <button
            onClick={handleResend}
            className="text-sm text-[#c4a747] hover:text-[#a88d3a] transition-colors"
          >
            Resend code
          </button>
        )}
      </div>
    </div>
  );
};
