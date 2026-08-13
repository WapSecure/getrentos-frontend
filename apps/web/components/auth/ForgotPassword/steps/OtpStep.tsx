'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { OtpInput } from '@/components/auth/OtpInput';

interface OtpStepProps {
  method: 'email' | 'phone';
  identifier: string;
  otp: string[];
  setOtp: (value: string[]) => void;
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
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <CheckCircle className="w-8 h-8 text-primary" />
        </motion.div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Verify Your {method}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We sent a verification code to <span className="font-medium">{identifier}</span>
        </p>
      </div>

      <OtpInput value={otp} onChange={setOtp} />

      <div className="text-center">
        {!canResend ? (
          <p className="text-sm text-gray-500">Resend code in {formatTime(timeLeft)}</p>
        ) : (
          <button
            onClick={handleResend}
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            Resend code
          </button>
        )}
      </div>
    </div>
  );
};
