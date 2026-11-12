'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fingerprint, KeyRound, Shield, Trash2, X } from '@sureground/icons';
import { startRegistration } from '@simplewebauthn/browser';
import {
  Button,
  ConfirmDialog,
  Field,
  IconButton,
  Input,
  NumberInput,
  Skeleton,
  Switch,
  useToast,
} from '@sureground/ui';
import {
  cleanSecondFactorInput,
  isSecondFactorCode,
  SECOND_FACTOR_CODE_MAX_LENGTH,
  TRANSACTION_PIN_LENGTH,
} from '@sureground/shared';
import { accountSecurityService } from '@/services/accountSecurityService';
import { unwrap } from '@/lib/apiHelpers';
import { accountSecurityKeys } from '@/lib/queryKeys';
import type { TwoFactorEnrollment } from '@/types/accountSecurity';
import { BackupCodes } from './BackupCodes';
import { ChangePasswordCard } from './ChangePasswordCard';
import { SignedInDevices } from './SignedInDevices';
import { PayoutHolds } from './PayoutHolds';
import { RecentSignIns } from './RecentSignIns';

type TwoFactorStep = 'idle' | 'setup' | 'disable';

const TWO_FACTOR_SWITCH_ID = 'two-factor-switch';

export const SecuritySettings = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    data: twoFactor,
    isError: twoFactorFailed,
    isFetching: twoFactorFetching,
    refetch: refetchTwoFactor,
  } = useQuery({
    queryKey: accountSecurityKeys.twoFactor,
    queryFn: () => unwrap(accountSecurityService.getTwoFactorStatus()),
    throwOnError: false,
  });

  const {
    data: security,
    isError: securityFailed,
    isFetching: securityFetching,
    refetch: refetchSecurity,
  } = useQuery({
    queryKey: accountSecurityKeys.overview,
    queryFn: () => unwrap(accountSecurityService.getOverview()),
    throwOnError: false,
  });

  const [pinOpen, setPinOpen] = useState(false);
  const [pinForgot, setPinForgot] = useState(false);
  const [pinPassword, setPinPassword] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [pinReference, setPinReference] = useState<string | null>(null);
  const [pinSentTo, setPinSentTo] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  const resetPin = () => {
    setPinOpen(false);
    setPinForgot(false);
    setPinPassword('');
    setCurrentPin('');
    setPinReference(null);
    setPinSentTo(null);
    setPinCode('');
    setPin('');
    setPinConfirm('');
  };

  const hasPin = !!security?.hasTransactionPin;
  // Accounts that only sign in with Google or Apple have no password to give.
  const needsPassword = security?.hasPassword !== false;
  // With a PIN already set the current one proves it, unless it's forgotten.
  const useCurrentPin = hasPin && !pinForgot;

  const sendPinCodeMutation = useMutation({
    mutationFn: () => unwrap(accountSecurityService.sendSecurityCode()),
    onSuccess: (res) => {
      setPinReference(res.reference);
      setPinSentTo(res.sentTo);
    },
    onError: (err: Error) => toast.error(err.message || 'Could not send a code right now'),
  });

  const setPinMutation = useMutation({
    mutationFn: () =>
      unwrap(
        accountSecurityService.setTransactionPin({
          ...(needsPassword ? { currentPassword: pinPassword } : {}),
          pin,
          ...(useCurrentPin
            ? { currentPin }
            : { reference: pinReference ?? undefined, code: pinCode }),
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.overview });
      resetPin();
      toast.success('Transaction PIN saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not save your PIN'),
  });

  const pinMismatch = pinConfirm.length === TRANSACTION_PIN_LENGTH && pin !== pinConfirm;
  const pinProofReady =
    (!needsPassword || pinPassword.length > 0) &&
    (useCurrentPin
      ? /^(\d{4}|\d{6})$/.test(currentPin)
      : !!pinReference && /^\d{6}$/.test(pinCode));
  const pinReady = pinProofReady && /^\d{6}$/.test(pin) && pin === pinConfirm;

  const { data: passkeyData } = useQuery({
    queryKey: accountSecurityKeys.passkeys,
    queryFn: () => unwrap(accountSecurityService.listPasskeys()),
  });
  const passkeys = passkeyData?.passkeys ?? [];
  const [removingPasskey, setRemovingPasskey] = useState<{ id: string; name: string } | null>(null);

  const addPasskeyMutation = useMutation({
    mutationFn: async () => {
      const options = await unwrap(accountSecurityService.startPasskeyRegistration());
      const attestation = await startRegistration({ optionsJSON: options as never });
      const label =
        typeof navigator !== 'undefined' && /iPhone|iPad|Android/i.test(navigator.userAgent)
          ? 'This phone'
          : 'This device';
      return unwrap(accountSecurityService.finishPasskeyRegistration(attestation, label));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.passkeys });
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.overview });
      toast.success('Passkey added');
    },
    onError: (err: Error) => {
      // A user cancelling the browser prompt is not an error worth shouting about.
      if (/NotAllowedError|AbortError|cancel/i.test(err.message)) return;
      toast.error(err.message || 'Could not add that passkey');
    },
  });

  const removePasskeyMutation = useMutation({
    mutationFn: (id: string) => unwrap(accountSecurityService.removePasskey(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.passkeys });
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.overview });
      toast.success('Passkey removed');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not remove that passkey'),
  });

  const [step, setStep] = useState<TwoFactorStep>('idle');
  const [enroll, setEnroll] = useState<TwoFactorEnrollment | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const [confirmNewCodes, setConfirmNewCodes] = useState(false);

  const resetSetup = () => {
    setStep('idle');
    setEnroll(null);
    setCode('');
    setCodeError(null);
  };

  /** Closing the panel unmounts the focused control, so hand focus back to the switch. */
  const cancelSetup = () => {
    resetSetup();
    requestAnimationFrame(() => document.getElementById(TWO_FACTOR_SWITCH_ID)?.focus());
  };

  const enrollMutation = useMutation({
    mutationFn: () => unwrap(accountSecurityService.enrollTwoFactor()),
    onSuccess: (data) => {
      setEnroll(data);
      setStep('setup');
      setCode('');
      setCodeError(null);
    },
    onError: (err: Error) => {
      // Already enrolled (secret stored but not yet enabled): jump to the code step.
      if (/already enrolled/i.test(err.message)) {
        setStep('setup');
        return;
      }
      toast.error(err.message || 'Failed to start enrollment');
    },
  });

  const enableMutation = useMutation({
    mutationFn: (token: string) => unwrap(accountSecurityService.enableTwoFactor(token)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.twoFactor });
      resetSetup();
      setFreshCodes(data.recoveryCodes);
      toast.success('Two-factor authentication enabled');
    },
    onError: (err: Error) => setCodeError(err.message || 'The code is invalid or has expired'),
  });

  const disableMutation = useMutation({
    mutationFn: (token: string) => unwrap(accountSecurityService.disableTwoFactor(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.twoFactor });
      resetSetup();
      toast.success('Two-factor authentication disabled');
    },
    onError: (err: Error) => setCodeError(err.message || 'The code is invalid or has expired'),
  });

  const newCodesMutation = useMutation({
    mutationFn: () => unwrap(accountSecurityService.regenerateRecoveryCodes()),
    onSuccess: (data) => {
      setConfirmNewCodes(false);
      setFreshCodes(data.recoveryCodes);
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.twoFactor });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not make new backup codes'),
  });

  const enabled = !!twoFactor?.enabled;
  const codesLeft = twoFactor?.recoveryCodesLeft ?? 0;
  // Until the real status is known the switch must not read "off": flipping it would start enrolment for someone who already has 2FA.
  const twoFactorKnown = twoFactor !== undefined;
  const pinKnown = security !== undefined;

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Security settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        How you sign in, how you confirm payments, and where you&apos;re signed in
      </p>

      <div className="space-y-6">
        {security?.hasPassword && <ChangePasswordCard />}

        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="p-2 rounded-lg bg-info-subtle">
                <Fingerprint className="w-5 h-5 text-info" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">Passkey</h3>
                <p className="text-sm text-muted-foreground">
                  The strongest way to confirm money actions — Face ID, fingerprint, or a security
                  key. Nothing to remember, and it can&apos;t be phished.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => addPasskeyMutation.mutate()}
              isLoading={addPasskeyMutation.isPending}
            >
              Add passkey
            </Button>
          </div>

          {passkeys.length > 0 && (
            <ul className="mt-4 space-y-2">
              {passkeys.map((pk) => (
                <li
                  key={pk.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {pk.deviceName || 'Passkey'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(pk.createdAt).toLocaleDateString()}
                      {pk.lastUsedAt
                        ? ` · last used ${new Date(pk.lastUsedAt).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <IconButton
                    size="sm"
                    label={`Remove ${pk.deviceName || 'passkey'}`}
                    icon={<Trash2 />}
                    onClick={() =>
                      setRemovingPasskey({ id: pk.id, name: pk.deviceName || 'Passkey' })
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          <ConfirmDialog
            open={removingPasskey !== null}
            onOpenChange={(open) => {
              if (!open) setRemovingPasskey(null);
            }}
            title="Remove this passkey?"
            description={
              removingPasskey
                ? `"${removingPasskey.name}" is removed from your account and you will no longer be able to sign in with it. To use it again you would need to add it as a new passkey.`
                : ''
            }
            confirmLabel="Remove"
            onConfirm={() =>
              removingPasskey && removePasskeyMutation.mutateAsync(removingPasskey.id)
            }
            isLoading={removePasskeyMutation.isPending}
          />
        </div>

        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="p-2 rounded-lg bg-info-subtle">
                <Shield className="w-5 h-5 text-info" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">Two-factor authentication</h3>
                <p
                  className="text-sm text-muted-foreground"
                  role={twoFactorFailed && !twoFactorKnown ? 'alert' : undefined}
                >
                  {!twoFactorKnown
                    ? twoFactorFailed
                      ? 'We could not check your two-factor status.'
                      : 'Checking your two-factor status…'
                    : enabled
                      ? 'Your account is protected by an authenticator app'
                      : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
            {twoFactorKnown ? (
              <Switch
                id={TWO_FACTOR_SWITCH_ID}
                checked={enabled}
                onCheckedChange={() => (enabled ? setStep('disable') : enrollMutation.mutate())}
                disabled={enrollMutation.isPending}
                aria-label="Toggle two-factor authentication"
              />
            ) : twoFactorFailed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetchTwoFactor()}
                isLoading={twoFactorFetching}
              >
                Retry
              </Button>
            ) : (
              <Skeleton className="h-6 w-11 rounded-full" />
            )}
          </div>

          {step === 'setup' && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Set up your authenticator app</h4>
                <IconButton size="sm" label="Cancel setup" onClick={cancelSetup} icon={<X />} />
              </div>

              {enroll ? (
                <div className="flex flex-col items-center gap-3 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={enroll.qrDataUrl}
                    alt="Scan this QR code with your authenticator app"
                    className="w-44 h-44 rounded-lg border border-border bg-white"
                  />
                  <p className="text-xs text-muted-foreground">
                    Scan with Google Authenticator, Authy, 1Password or similar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Or enter this code manually:{' '}
                    <span className="font-mono font-medium text-foreground break-all">
                      {enroll.secret}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Your secret is already stored: enter a code from your authenticator app to finish
                  enabling two-factor authentication.
                </p>
              )}

              <form
                className="flex flex-col sm:flex-row sm:items-start gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.length === 6) enableMutation.mutate(code);
                }}
              >
                <Field label="Authenticator code" error={codeError || undefined} className="flex-1">
                  <NumberInput
                    value={code}
                    onValueChange={(value) => {
                      setCode(value.slice(0, 6));
                      setCodeError(null);
                    }}
                    placeholder="6-digit code"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </Field>
                <Button
                  type="submit"
                  variant="primary"
                  className="sm:mt-6"
                  isLoading={enableMutation.isPending}
                  disabled={code.length !== 6}
                >
                  Enable 2FA
                </Button>
              </form>
            </div>
          )}

          {step === 'disable' && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Disable two-factor authentication</h4>
                <IconButton size="sm" label="Cancel disable" onClick={cancelSetup} icon={<X />} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Enter a current code from your authenticator app, or a backup code if you no longer
                have your phone.
              </p>
              <form
                className="flex flex-col sm:flex-row sm:items-start gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isSecondFactorCode(code)) disableMutation.mutate(code);
                }}
              >
                <Field
                  label="Authenticator or backup code"
                  error={codeError || undefined}
                  className="flex-1"
                >
                  <Input
                    value={code}
                    onChange={(e) => {
                      setCode(cleanSecondFactorInput(e.target.value));
                      setCodeError(null);
                    }}
                    placeholder="123456"
                    maxLength={SECOND_FACTOR_CODE_MAX_LENGTH}
                    autoComplete="one-time-code"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </Field>
                <Button
                  type="submit"
                  variant="danger"
                  className="sm:mt-6"
                  isLoading={disableMutation.isPending}
                  disabled={!isSecondFactorCode(code)}
                >
                  Disable 2FA
                </Button>
              </form>
            </div>
          )}

          {freshCodes ? (
            <BackupCodes codes={freshCodes} onDone={() => setFreshCodes(null)} />
          ) : enabled && step === 'idle' ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
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
          ) : null}
          <ConfirmDialog
            open={confirmNewCodes}
            onOpenChange={setConfirmNewCodes}
            title="Get new backup codes?"
            description="Your current backup codes will stop working. You'll be asked to confirm it's you."
            confirmLabel="Get new codes"
            tone="primary"
            onConfirm={() => newCodesMutation.mutate()}
            isLoading={newCodesMutation.isPending}
          />
        </div>
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="p-2 rounded-lg bg-info-subtle">
                <KeyRound className="w-5 h-5 text-info" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">Transaction PIN</h3>
                <p
                  className="text-sm text-muted-foreground"
                  role={securityFailed && !pinKnown ? 'alert' : undefined}
                >
                  {!pinKnown
                    ? securityFailed
                      ? 'We could not check whether you have a PIN.'
                      : 'Checking your PIN…'
                    : hasPin
                      ? 'Required to release or refund money — a separate secret from your password'
                      : 'Set a 6-digit PIN to confirm money actions, so your password alone isn’t enough'}
                </p>
              </div>
            </div>
            {!pinOpen &&
              (pinKnown ? (
                <Button variant={hasPin ? 'outline' : 'primary'} onClick={() => setPinOpen(true)}>
                  {hasPin ? 'Change PIN' : 'Set PIN'}
                </Button>
              ) : securityFailed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetchSecurity()}
                  isLoading={securityFetching}
                >
                  Retry
                </Button>
              ) : (
                <Skeleton className="h-9 w-24 rounded-lg" />
              ))}
          </div>

          {pinOpen && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  {pinForgot ? 'Reset your PIN' : hasPin ? 'Change your PIN' : 'Set your PIN'}
                </h4>
                <IconButton size="sm" label="Cancel" onClick={resetPin} icon={<X />} />
              </div>
              {needsPassword && (
                <Field label="Current password">
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={pinPassword}
                    onChange={(e) => setPinPassword(e.target.value)}
                    placeholder="Your Sureground password"
                  />
                </Field>
              )}
              {useCurrentPin ? (
                <Field
                  label="Current PIN"
                  labelAside={
                    <Button variant="link" onClick={() => setPinForgot(true)}>
                      Forgot your PIN?
                    </Button>
                  }
                >
                  <NumberInput
                    masked
                    value={currentPin}
                    onValueChange={setCurrentPin}
                    placeholder="Your current PIN"
                    maxLength={TRANSACTION_PIN_LENGTH}
                    autoComplete="off"
                  />
                </Field>
              ) : pinReference ? (
                <Field
                  label="Code we sent you"
                  hint={pinSentTo ? `We sent a code to ${pinSentTo}.` : undefined}
                >
                  <NumberInput
                    value={pinCode}
                    onValueChange={setPinCode}
                    placeholder="6-digit code"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </Field>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    {pinForgot
                      ? 'We’ll send you a code so you can choose a new PIN.'
                      : 'We’ll send you a code to confirm it’s you.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendPinCodeMutation.mutate()}
                    isLoading={sendPinCodeMutation.isPending}
                  >
                    Send me a code
                  </Button>
                </div>
              )}
              <Field label="New 6-digit PIN">
                <NumberInput
                  masked
                  value={pin}
                  onValueChange={setPin}
                  placeholder="6-digit PIN"
                  maxLength={TRANSACTION_PIN_LENGTH}
                  autoComplete="off"
                />
              </Field>
              <Field
                label="Confirm PIN"
                error={pinMismatch ? 'Those PINs don’t match.' : undefined}
              >
                <NumberInput
                  masked
                  value={pinConfirm}
                  onValueChange={setPinConfirm}
                  placeholder="Re-enter PIN"
                  maxLength={TRANSACTION_PIN_LENGTH}
                  autoComplete="off"
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={resetPin}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setPinMutation.mutate()}
                  isLoading={setPinMutation.isPending}
                  disabled={!pinReady}
                >
                  Save PIN
                </Button>
              </div>
            </div>
          )}
        </div>

        <PayoutHolds />
        <SignedInDevices />
        <RecentSignIns />
      </div>
    </div>
  );
};
