/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@getrentos/ui';
import { CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { AUTH_CONSTANTS } from '@/lib/constants/auth';
import { OtpInput } from '@/components/auth/OtpInput';

interface OtpVerificationProps {
  identifier: string;
  method: 'email' | 'phone' | 'whatsapp';
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
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Verify your {method === 'whatsapp' ? 'WhatsApp' : method}
        </h3>
        <p className="text-sm text-muted-foreground">
          We sent a verification code to your{' '}
          <span className="font-medium text-foreground">
            {method === 'whatsapp' ? 'WhatsApp' : method}
          </span>{' '}
          at <span className="font-medium text-foreground">{identifier}</span>
        </p>
      </div>

      {/* OTP Inputs */}
      <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

      {/* Timer & Resend */}
      <div className="text-center">
        {!canResend ? (
          <p className="text-sm text-muted-foreground">
            Resend code in {formatTime(timeLeft)}
          </p>
        ) : (
          <Button
            variant="link"
            onClick={handleResend}
            disabled={isLoading}
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Resend code
          </Button>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={otp.join('').length !== AUTH_CONSTANTS.OTP_LENGTH}
        isLoading={isLoading}
        fullWidth
        size="lg"
        rounded="lg"
        icon={<ArrowRight className="w-4 h-4" />}
        iconPosition="right"
      >
        Verify & Continue
      </Button>
    </div>
  );
};
