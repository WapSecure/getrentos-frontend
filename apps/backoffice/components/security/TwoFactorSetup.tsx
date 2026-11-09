'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  CardDescription,
  CardHeader,
  CardSkeleton,
  CardTitle,
  DescriptionList,
  Field,
  Input,
  NumberInput,
  QueryState,
  useToast,
} from '@sureground/ui';
import {
  cleanSecondFactorInput,
  clearStepUpToken,
  isSecondFactorCode,
  SECOND_FACTOR_CODE_MAX_LENGTH,
  unwrap,
} from '@sureground/shared';
import { BackupCodes } from '@/components/security/BackupCodes';
import { accountSecurityService } from '@/services/accountSecurityService';
import { adminKeys } from '@/lib/queryKeys';
import type { TwoFactorEnrollment } from '@/types/admin';

export const STAFF_TWO_FACTOR_EXPLAINER =
  "Staff accounts need two-factor authentication. It means someone who gets your password still can't sign in.";

const CODE_LENGTH = 6;

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
  allowBackupCode = false,
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
  onCodeChange: () => void;
  onCancel?: () => void;
  /** Also accepts a one-time backup code, for turning two-factor off without the phone. */
  allowBackupCode?: boolean;
}) {
  const [code, setCode] = useState('');
  const ready = allowBackupCode ? isSecondFactorCode(code) : code.length === CODE_LENGTH;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onSubmit(code);
      }}
    >
      <Field label={label} error={error ?? undefined}>
        {allowBackupCode ? (
          <Input
            value={code}
            onChange={(event) => {
              setCode(cleanSecondFactorInput(event.target.value));
              onCodeChange();
            }}
            placeholder="123456"
            maxLength={SECOND_FACTOR_CODE_MAX_LENGTH}
            autoComplete="one-time-code"
            autoCapitalize="none"
            spellCheck={false}
          />
        ) : (
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
        )}
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

/** `gate` is the focused version shown when two-factor is off: it only sets up. */
export function TwoFactorSetup({ gate = false }: { gate?: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const status = useStaffTwoFactorStatus();
  const [step, setStep] = useState<Step>('idle');
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const [confirmNewCodes, setConfirmNewCodes] = useState(false);

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
    onSuccess: (data) => {
      // The confirmation used here may be set-up-only; drop it so the next sensitive action asks again with the new factor.
      clearStepUpToken();
      reset();
      // Refresh only once the codes are saved: in the sign-in gate, refreshing
      // the status would close the gate and hide them.
      setFreshCodes(data.recoveryCodes);
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

  const newCodes = useMutation({
    mutationFn: () => unwrap(accountSecurityService.regenerateRecoveryCodes()),
    onSuccess: (data) => {
      setConfirmNewCodes(false);
      setFreshCodes(data.recoveryCodes);
    },
    onError: (err) => toast.error(errorText(err, 'We could not make new backup codes.')),
  });

  const codesSaved = () => {
    setFreshCodes(null);
    // Everything refused while two-factor was off can load now.
    void queryClient.invalidateQueries();
  };

  const enabled = !!status.data?.enabled;
  const codesLeft = status.data?.recoveryCodesLeft ?? 0;

  return (
    <QueryState
      isLoading={status.isLoading}
      isError={status.isError && !status.data}
      onRetry={() => void status.refetch()}
      isRetrying={status.isFetching}
      errorTitle="We could not check your two-factor status"
      loading={<CardSkeleton lines={3} />}
    >
      <Card static>
        <CardHeader
          action={
            step === 'idle' &&
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
            ))
          }
        >
          <CardTitle className="flex flex-wrap items-center gap-2">
            Authenticator app
            <Badge variant={enabled ? 'success' : 'warning'}>{enabled ? 'On' : 'Off'}</Badge>
          </CardTitle>
          <CardDescription>
            {enabled
              ? 'Signing in asks for a code from your authenticator app.'
              : 'Use an app such as Google Authenticator, Microsoft Authenticator, Authy or 1Password.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'setup' && enrollment && (
            <>
              <Alert variant="neutral" title="Add Sureground to your authenticator app">
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Open your authenticator app and add a new account.</li>
                  <li>Scan this QR code, or type the set-up key instead.</li>
                  <li>Enter the 6-digit code the app shows.</li>
                </ol>
              </Alert>
              {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from the API */}
              <img
                src={enrollment.qrDataUrl}
                alt="QR code to add this account to your authenticator app"
                className="h-44 w-44 bg-white"
              />
              <DescriptionList items={[{ label: 'Set-up key', value: enrollment.secret }]} />
              <CodeForm
                label="Code from your app"
                submitLabel="Turn on two-factor"
                isPending={enable.isPending}
                error={codeError}
                onSubmit={(code) => enable.mutate(code)}
                onCodeChange={() => setCodeError(null)}
                onCancel={gate ? undefined : reset}
              />
            </>
          )}

          {step === 'disable' && (
            <>
              <Alert variant="warning">
                Enter a current code from your authenticator app, or a backup code, to turn
                two-factor off. Staff accounts can&apos;t use the admin tools until it is back on.
              </Alert>
              <CodeForm
                allowBackupCode
                label="Code from your app or a backup code"
                submitLabel="Turn off two-factor"
                variant="danger"
                isPending={disable.isPending}
                error={codeError}
                onSubmit={(code) => disable.mutate(code)}
                onCodeChange={() => setCodeError(null)}
                onCancel={reset}
              />
            </>
          )}

          {freshCodes ? (
            <BackupCodes codes={freshCodes} onDone={codesSaved} />
          ) : (
            enabled &&
            step === 'idle' &&
            !gate && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {codesLeft === 0
                    ? 'No backup codes left. Get new ones so a lost phone can’t lock you out.'
                    : `${codesLeft} backup code${codesLeft === 1 ? '' : 's'} left for when you don’t have your phone.`}
                </p>
                <Button
                  variant={codesLeft <= 2 ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setConfirmNewCodes(true)}
                >
                  Get new backup codes
                </Button>
              </div>
            )
          )}
          <ConfirmDialog
            open={confirmNewCodes}
            onOpenChange={setConfirmNewCodes}
            title="Get new backup codes?"
            description="Your current backup codes will stop working. You'll be asked to confirm it's you."
            confirmLabel="Get new codes"
            tone="primary"
            onConfirm={() => newCodes.mutate()}
            isLoading={newCodes.isPending}
          />
        </CardContent>
      </Card>
    </QueryState>
  );
}
