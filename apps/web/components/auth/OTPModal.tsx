'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@getrentos/ui';
import { OtpInput } from '@/components/auth/OtpInput';

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
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
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
      setOtp(Array(6).fill(''));
      setTimeLeft(300);
      setCanResend(false);
      setError(null);
    }
  }, [isOpen]);

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setIsVerifying(true);
    try {
      await onVerify(otpValue);
    } catch {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimeLeft(300);
    setOtp(Array(6).fill(''));
    await onResend();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground mb-2">
            Verify Your {method === 'email' ? 'Email' : 'Phone'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            We sent a verification code to{' '}
            <span className="font-medium text-foreground">{identifier}</span>
          </DialogDescription>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="mb-6">
          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError(null);
            }}
            disabled={isVerifying}
          />
        </div>

        <div className="text-center mb-6">
          {!canResend ? (
            <p className="text-sm text-muted-foreground">Resend code in {formatTime(timeLeft)}</p>
          ) : (
            <Button
              variant="link"
              onClick={handleResend}
              icon={<RefreshCw className="w-3 h-3" />}
            >
              Resend code
            </Button>
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
      </DialogContent>
    </Dialog>
  );
};
