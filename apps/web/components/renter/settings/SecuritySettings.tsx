'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fingerprint, KeyRound, Shield, Trash2, X } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { Button, IconButton, Input, NumberInput, Switch, useToast } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface TwoFactorEnroll {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

type TwoFactorStep = 'idle' | 'setup' | 'disable';

export const SecuritySettings = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: twoFactor } = useQuery({
    queryKey: renterKeys.twoFactor,
    queryFn: () => unwrap(renterService.getTwoFactorStatus()),
  });

  const { data: security } = useQuery({
    queryKey: renterKeys.securityOverview,
    queryFn: () => unwrap(renterService.getSecurityOverview()),
  });

  const [pinOpen, setPinOpen] = useState(false);
  const [pinPassword, setPinPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  const resetPin = () => {
    setPinOpen(false);
    setPinPassword('');
    setPin('');
    setPinConfirm('');
  };

  const setPinMutation = useMutation({
    mutationFn: () => unwrap(renterService.setTransactionPin(pinPassword, pin)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.securityOverview });
      resetPin();
      toast.success('Transaction PIN saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not save your PIN'),
  });

  const hasPin = !!security?.hasTransactionPin;
  const pinMismatch = pinConfirm.length === 4 && pin !== pinConfirm;
  const pinReady = pinPassword.length > 0 && pin.length === 4 && pin === pinConfirm;

  // ---- Passkeys ----
  const { data: passkeyData } = useQuery({
    queryKey: renterKeys.passkeys,
    queryFn: () => unwrap(renterService.listPasskeys()),
  });
  const passkeys = passkeyData?.passkeys ?? [];

  const addPasskeyMutation = useMutation({
    mutationFn: async () => {
      const options = await unwrap(renterService.startPasskeyRegistration());
      // Browser prompts for Face ID / fingerprint / security key here.
      const attestation = await startRegistration({ optionsJSON: options as never });
      const label =
        typeof navigator !== 'undefined' && /iPhone|iPad|Android/i.test(navigator.userAgent)
          ? 'This phone'
          : 'This device';
      return unwrap(renterService.finishPasskeyRegistration(attestation, label));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.passkeys });
      queryClient.invalidateQueries({ queryKey: renterKeys.securityOverview });
      toast.success('Passkey added');
    },
    onError: (err: Error) => {
      // A user cancelling the browser prompt is not an error worth shouting about.
      if (/NotAllowedError|AbortError|cancel/i.test(err.message)) return;
      toast.error(err.message || 'Could not add that passkey');
    },
  });

  const removePasskeyMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.removePasskey(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.passkeys });
      queryClient.invalidateQueries({ queryKey: renterKeys.securityOverview });
      toast.success('Passkey removed');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not remove that passkey'),
  });

  const [step, setStep] = useState<TwoFactorStep>('idle');
  const [enroll, setEnroll] = useState<TwoFactorEnroll | null>(null);
  const [code, setCode] = useState('');

  const resetSetup = () => {
    setStep('idle');
    setEnroll(null);
    setCode('');
  };

  const enrollMutation = useMutation({
    mutationFn: () => unwrap(renterService.enrollTwoFactor()),
    onSuccess: (data) => {
      setEnroll(data);
      setStep('setup');
      setCode('');
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
    mutationFn: (token: string) => unwrap(renterService.enableTwoFactor(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.twoFactor });
      resetSetup();
      toast.success('Two-factor authentication enabled');
    },
    onError: (err: Error) => toast.error(err.message || 'The code is invalid or has expired'),
  });

  const disableMutation = useMutation({
    mutationFn: (token: string) => unwrap(renterService.disableTwoFactor(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.twoFactor });
      resetSetup();
      toast.success('Two-factor authentication disabled');
    },
    onError: (err: Error) => toast.error(err.message || 'The code is invalid or has expired'),
  });

  const enabled = !!twoFactor?.enabled;

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Security Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your account security and authentication methods
      </p>

      <div className="space-y-6">
        {/* Passkey — the strongest factor */}
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
                    label="Remove passkey"
                    icon={<Trash2 />}
                    onClick={() => removePasskeyMutation.mutate(pk.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="p-2 rounded-lg bg-info-subtle">
                <Shield className="w-5 h-5 text-info" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  {enabled
                    ? 'Your account is protected by an authenticator app'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={() => (enabled ? setStep('disable') : enrollMutation.mutate())}
              disabled={enrollMutation.isPending}
              aria-label="Toggle two-factor authentication"
            />
          </div>

          {step === 'setup' && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Set up your authenticator app</h4>
                <IconButton size="sm" label="Cancel setup" onClick={resetSetup} icon={<X />} />
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

              <div className="flex flex-col sm:flex-row gap-2">
                <NumberInput
                  aria-label="Authenticator code"
                  value={code}
                  onValueChange={(value) => setCode(value.slice(0, 6))}
                  placeholder="6-digit code"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  onClick={() => code.length === 6 && enableMutation.mutate(code)}
                  isLoading={enableMutation.isPending}
                  disabled={code.length !== 6}
                >
                  Enable 2FA
                </Button>
              </div>
            </div>
          )}

          {step === 'disable' && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Disable two-factor authentication</h4>
                <IconButton size="sm" label="Cancel disable" onClick={resetSetup} icon={<X />} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Enter a current code from your authenticator app to confirm.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <NumberInput
                  aria-label="Authenticator code"
                  value={code}
                  onValueChange={(value) => setCode(value.slice(0, 6))}
                  placeholder="6-digit code"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="flex-1"
                />
                <Button
                  variant="danger"
                  onClick={() => code.length === 6 && disableMutation.mutate(code)}
                  isLoading={disableMutation.isPending}
                  disabled={code.length !== 6}
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}
        </div>
        {/* Transaction PIN */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="p-2 rounded-lg bg-info-subtle">
                <KeyRound className="w-5 h-5 text-info" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">Transaction PIN</h3>
                <p className="text-sm text-muted-foreground">
                  {hasPin
                    ? 'Required to release or refund money — a separate secret from your password'
                    : 'Set a 4-digit PIN to confirm money actions, so your password alone isn’t enough'}
                </p>
              </div>
            </div>
            {!pinOpen && (
              <Button variant={hasPin ? 'outline' : 'primary'} onClick={() => setPinOpen(true)}>
                {hasPin ? 'Change PIN' : 'Set PIN'}
              </Button>
            )}
          </div>

          {pinOpen && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  {hasPin ? 'Change your PIN' : 'Set your PIN'}
                </h4>
                <IconButton size="sm" label="Cancel" onClick={resetPin} icon={<X />} />
              </div>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Current password</span>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={pinPassword}
                  onChange={(e) => setPinPassword(e.target.value)}
                  placeholder="Your GetRentos password"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">New 4-digit PIN</span>
                <NumberInput
                  aria-label="New transaction PIN"
                  value={pin}
                  onValueChange={(value) => setPin(value.slice(0, 4))}
                  placeholder="4-digit PIN"
                  maxLength={4}
                  autoComplete="off"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Confirm PIN</span>
                <NumberInput
                  aria-label="Confirm transaction PIN"
                  value={pinConfirm}
                  onValueChange={(value) => setPinConfirm(value.slice(0, 4))}
                  placeholder="Re-enter PIN"
                  maxLength={4}
                  autoComplete="off"
                />
              </label>
              {pinMismatch && <p className="text-sm text-destructive">Those PINs don’t match.</p>}
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
      </div>
    </div>
  );
};
