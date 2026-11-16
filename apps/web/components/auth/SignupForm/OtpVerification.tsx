'use client';

import { useEffect, useId, useState } from 'react';
import { Button } from '@sureground/ui';
import { RefreshCw, ArrowRight } from '@sureground/icons';
import { AUTH_CONSTANTS } from '@/lib/constants/auth';
import { OtpInput } from '@/components/auth/OtpInput';

interface OtpVerificationProps {
  channel: 'email' | 'phone' | 'whatsapp';
  onSubmit: (otp: string) => Promise<boolean>;
  /** Resolves true only when a new code went out. */
  onResend: () => Promise<boolean>;
  isLoading: boolean;
  isResending: boolean;
}

const emptyCode = () => Array<string>(AUTH_CONSTANTS.OTP_LENGTH).fill('');
// After this many wrong codes the person can ask for a new one straight away.
const FAILURES_BEFORE_RESEND = 5;

export const OtpVerification = ({
  channel,
  onSubmit,
  onResend,
  isLoading,
  isResending,
}: OtpVerificationProps) => {
  const hintId = useId();
  const [otp, setOtp] = useState<string[]>(emptyCode);
  const [secondsLeft, setSecondsLeft] = useState<number>(AUTH_CONSTANTS.RESEND_OTP_DELAY_SECONDS);
  const [failures, setFailures] = useState(0);
  const [focusSignal, setFocusSignal] = useState(0);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const canResend = secondsLeft <= 0 || failures >= FAILURES_BEFORE_RESEND;

  const verify = async (code: string) => {
    if (code.length !== AUTH_CONSTANTS.OTP_LENGTH || isLoading) return;
    setInvalid(false);
    const ok = await onSubmit(code);
    if (!ok) {
      setFailures((n) => n + 1);
      setInvalid(true);
      setOtp(emptyCode());
      setFocusSignal((n) => n + 1);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    const sent = await onResend();
    if (sent) {
      setSecondsLeft(AUTH_CONSTANTS.RESEND_OTP_DELAY_SECONDS);
      setFailures(0);
      setInvalid(false);
      setOtp(emptyCode());
      setFocusSignal((n) => n + 1);
    }
  };

  return (
    <form
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
        void verify(otp.join(''));
      }}
      className="space-y-6"
    >
      <OtpInput
        value={otp}
        onChange={(next) => {
          setOtp(next);
          if (invalid) setInvalid(false);
        }}
        onComplete={(code) => void verify(code)}
        disabled={isLoading}
        autoFocus
        invalid={invalid}
        focusSignal={focusSignal}
        label="Verification code, 6 digits"
        describedBy={hintId}
      />

      <p id={hintId} className="text-center text-sm text-muted-foreground">
        The code expires in {AUTH_CONSTANTS.OTP_EXPIRY_MINUTES} minutes.
        {channel === 'email' ? ' Not there? Check your spam folder.' : ''}
      </p>

      <Button
        type="submit"
        isLoading={isLoading && !isResending}
        fullWidth
        size="lg"
        rounded="lg"
        icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        iconPosition="right"
      >
        Verify and continue
      </Button>

      <div className="flex min-h-11 items-center justify-center">
        {canResend ? (
          <Button
            type="button"
            variant="ghost"
            rounded="lg"
            onClick={() => void handleResend()}
            isLoading={isResending}
            icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          >
            Send a new code
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can ask for a new code in {secondsLeft} seconds
          </p>
        )}
      </div>
    </form>
  );
};
