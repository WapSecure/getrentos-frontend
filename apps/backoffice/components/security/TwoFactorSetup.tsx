'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import {
  Badge,
  Button,
  CardSkeleton,
  Field,
  NumberInput,
  QueryState,
  useToast,
} from '@getrentos/ui';
import { clearStepUpToken, unwrap } from '@getrentos/shared';
import { accountSecurityService } from '@/services/accountSecurityService';
import { adminKeys } from '@/lib/queryKeys';
import type { TwoFactorEnrollment } from '@/types/admin';

export const STAFF_TWO_FACTOR_EXPLAINER =
  "Staff accounts need two-factor authentication. It means someone who gets your password still can't sign in.";

const CODE_LENGTH = 6;

/** The signed-in staff member's two-factor status, shared by the settings tab and the gate. */
export function useStaffTwoFactorStatus() {
  return useQuery({
    queryKey: adminKeys.twoFactor,
    queryFn: () => unwrap(accountSecurityService.getTwoFactorStatus()),
    // The gate and the settings tab handle a failure themselves.
    throwOnError: false,
  });
}

type Step = 'idle' | 'setup' | 'disable';

const errorText = (err: unknown, fallback: string) =>
  err instanceof Error && err.message.trim() ? err.message : fallback;

function CodeForm({
  label,
  submitLabel,
  variant = 'primary',
  isPending,
  error,
  onSubmit,
  onCodeChange,
  onCancel,
}: {
  label: string;
  submitLabel: string;
  variant?: 'primary' | 'danger';
  isPending: boolean;
  error: string | null;
  onSubmit: (code: string) => void;
  /** Clears a stale "that code did not work" once the person types again. */
  onCodeChange: () => void;
  onCancel?: () => void;
}) {
  const [code, setCode] = useState('');
  const ready = code.length === CODE_LENGTH;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onSubmit(code);
      }}
    >
      <Field label={label} error={error ?? undefined}>
        <NumberInput
          value={code}
          onValueChange={(value) => {
            setCode(value.slice(0, CODE_LENGTH));
            onCodeChange();
          }}
          placeholder="6-digit code"
          maxLength={CODE_LENGTH}
          autoComplete="one-time-code"
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant={variant} disabled={!ready} isLoading={isPending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

/**
 * Turns the authenticator app on or off for the signed-in staff member:
 * start enrolment, scan the QR (or type the secret), confirm with a code.
 * `gate` is the focused version shown when two-factor is off: it only sets up.
 */
export function TwoFactorSetup({ gate = false }: { gate?: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const status = useStaffTwoFactorStatus();
  const [step, setStep] = useState<Step>('idle');
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const reset = () => {
    setStep('idle');
    setEnrollment(null);
    setCodeError(null);
  };

  const enroll = useMutation({
    mutationFn: () => unwrap(accountSecurityService.enrollTwoFactor()),
    onSuccess: (data) => {
      setEnrollment(data);
      setCodeError(null);
      setStep('setup');
    },
    onError: (err) => toast.error(errorText(err, 'We could not start the set-up. Try again.')),
  });

  const enable = useMutation({
    mutationFn: (token: string) => unwrap(accountSecurityService.enableTwoFactor(token)),
    onSuccess: () => {
      // The confirmation used to get here may be the set-up-only kind; drop it
      // so the next sensitive action asks again with the new factor.
      clearStepUpToken();
      reset();
      // Everything refused while two-factor was off can load now.
      void queryClient.invalidateQueries();
      toast.success('Two-factor authentication is on');
    },
    onError: (err) => setCodeError(errorText(err, 'That code did not work. Try the latest one.')),
  });

  const disable = useMutation({
    mutationFn: (token: string) => unwrap(accountSecurityService.disableTwoFactor(token)),
    onSuccess: () => {
      clearStepUpToken();
      reset();
      void queryClient.invalidateQueries({ queryKey: adminKeys.twoFactor });
      toast.success('Two-factor authentication is off');
    },
    onError: (err) => setCodeError(errorText(err, 'That code did not work. Try the latest one.')),
  });

  const enabled = !!status.data?.enabled;

  return (
    <QueryState
      isLoading={status.isLoading}
      isError={status.isError && !status.data}
      onRetry={() => void status.refetch()}
      isRetrying={status.isFetching}
      errorTitle="We could not check your two-factor status"
      loading={<CardSkeleton lines={3} />}
    >
      <div className="rounded-lg border border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-lg bg-info-subtle p-2">
              {enabled ? (
                <ShieldCheck className="h-5 w-5 text-info" aria-hidden="true" />
              ) : (
                <ShieldOff className="h-5 w-5 text-info" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                Authenticator app
                <Badge variant={enabled ? 'success' : 'warning'}>{enabled ? 'On' : 'Off'}</Badge>
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {enabled
                  ? 'Signing in asks for a code from your authenticator app.'
                  : 'Use an app such as Google Authenticator, Microsoft Authenticator, Authy or 1Password.'}
              </p>
            </div>
          </div>
          {step === 'idle' &&
            (enabled ? (
              !gate && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCodeError(null);
                    setStep('disable');
                  }}
                >
                  Turn off
                </Button>
              )
            ) : (
              <Button onClick={() => enroll.mutate()} isLoading={enroll.isPending}>
                Set up two-factor
              </Button>
            ))}
        </div>

        {step === 'setup' && enrollment && (
          <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/50 p-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Open your authenticator app and add a new account.</li>
              <li>Scan this QR code, or type the set-up key instead.</li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from the API */}
              <img
                src={enrollment.qrDataUrl}
                alt="QR code to add this account to your authenticator app"
                className="h-44 w-44 shrink-0 rounded-lg border border-border bg-white"
              />
              <div className="min-w-0 text-sm">
                <p className="text-muted-foreground">Set-up key</p>
                <p className="mt-1 break-all font-mono font-medium text-foreground select-all">
                  {enrollment.secret}
                </p>
              </div>
            </div>
            <CodeForm
              label="Code from your app"
              submitLabel="Turn on two-factor"
              isPending={enable.isPending}
              error={codeError}
              onSubmit={(code) => enable.mutate(code)}
              onCodeChange={() => setCodeError(null)}
              onCancel={gate ? undefined : reset}
            />
          </div>
        )}

        {step === 'disable' && (
          <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Enter a current code from your authenticator app to turn two-factor off. Staff
              accounts can&apos;t use the admin tools until it is back on.
            </p>
            <CodeForm
              label="Code from your app"
              submitLabel="Turn off two-factor"
              variant="danger"
              isPending={disable.isPending}
              error={codeError}
              onSubmit={(code) => disable.mutate(code)}
              onCodeChange={() => setCodeError(null)}
              onCancel={reset}
            />
          </div>
        )}
      </div>
    </QueryState>
  );
}
