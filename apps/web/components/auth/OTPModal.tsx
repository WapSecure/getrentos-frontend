'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  identifier: string;
  method: 'email' | 'phone';
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
}

export const OTPModal = ({
  isOpen,
  onClose,
  identifier,
  method,
  onVerify,
  onResend,
}: OTPModalProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeLeft > 0 && isOpen) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else if (timeLeft === 0 && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanResend(true);
    }
  }, [timeLeft, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(300);
      setCanResend(false);
      setError(null);
    }
  }, [isOpen]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setIsVerifying(true);
    try {
      await onVerify(otpValue);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimeLeft(300);
    setOtp(['', '', '', '', '', '']);
    await onResend();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md mx-4 bg-white dark:bg-[#1a2a2f] rounded-2xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#c4a747]/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[#c4a747]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verify Your {method === 'email' ? 'Email' : 'Phone'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We sent a verification code to{' '}
                <span className="font-medium text-gray-900 dark:text-white">{identifier}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-12 h-12 text-center text-xl font-semibold border rounded-lg bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#c4a747] focus:border-transparent transition-all"
                  maxLength={1}
                />
              ))}
            </div>

            <div className="text-center mb-6">
              {!canResend ? (
                <p className="text-sm text-gray-500">Resend code in {formatTime(timeLeft)}</p>
              ) : (
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-1 text-sm text-[#c4a747] hover:text-[#a88d3a] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Resend code
                </button>
              )}
            </div>

            <Button
              onClick={handleVerify}
              disabled={otp.join('').length !== 6 || isVerifying}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isVerifying}
            >
              Verify & Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
