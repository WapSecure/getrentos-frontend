'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Fingerprint, X } from 'lucide-react';
import { Button, Toast, ToastVariant } from '@getrentos/ui';
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
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  // Biometric remains a client-side preference (device-level toggle).
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const { data: prefs } = useQuery({
    queryKey: renterKeys.settingsPreferences,
    queryFn: () => unwrap(renterService.getSettingsPreferences()),
  });

  useEffect(() => {
    const saved = (prefs?.security ?? {}) as { biometricEnabled?: boolean };
    if (typeof saved.biometricEnabled === 'boolean') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBiometricEnabled(saved.biometricEnabled);
    }
  }, [prefs]);

  const { data: twoFactor } = useQuery({
    queryKey: renterKeys.twoFactor,
    queryFn: () => unwrap(renterService.getTwoFactorStatus()),
  });

  const [step, setStep] = useState<TwoFactorStep>('idle');
  const [enroll, setEnroll] = useState<TwoFactorEnroll | null>(null);
  const [code, setCode] = useState('');

  const resetSetup = () => {
    setStep('idle');
    setEnroll(null);
    setCode('');
  };

  const saveBiometric = useMutation({
    mutationFn: () =>
      unwrap(renterService.updateSettingsPreferences({ security: { biometricEnabled } })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.settingsPreferences });
      setToast({ message: 'Security settings saved', variant: 'success' });
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'Failed to save security settings', variant: 'error' }),
  });

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
      setToast({ message: err.message || 'Failed to start enrollment', variant: 'error' });
    },
  });

  const enableMutation = useMutation({
    mutationFn: (token: string) => unwrap(renterService.enableTwoFactor(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.twoFactor });
      resetSetup();
      setToast({ message: 'Two-factor authentication enabled', variant: 'success' });
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'The code is invalid or has expired', variant: 'error' }),
  });

  const disableMutation = useMutation({
    mutationFn: (token: string) => unwrap(renterService.disableTwoFactor(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.twoFactor });
      resetSetup();
      setToast({ message: 'Two-factor authentication disabled', variant: 'success' });
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'The code is invalid or has expired', variant: 'error' }),
  });

  const enabled = !!twoFactor?.enabled;

  return (
    <div>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <h2 className="text-xl font-semibold text-foreground mb-4">Security Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your account security and authentication methods
      </p>

      <div className="space-y-6">
        {/* Two-Factor Authentication */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  {enabled
                    ? 'Your account is protected by an authenticator app'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
            <button
              onClick={() => (enabled ? setStep('disable') : enrollMutation.mutate())}
              disabled={enrollMutation.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label="Toggle two-factor authentication"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {step === 'setup' && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Set up your authenticator app</h4>
                <button
                  onClick={resetSetup}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                  aria-label="Cancel setup"
                >
                  <X className="w-4 h-4" />
                </button>
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
                  Your secret is already stored — enter a code from your authenticator app to finish
                  enabling two-factor authentication.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button
                  variant="primary"
                  onClick={() => code.length === 6 && enableMutation.mutate(code)}
                  isLoading={enableMutation.isPending}
                  disabled={code.length !== 6 || enableMutation.isPending}
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
                <button
                  onClick={resetSetup}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                  aria-label="Cancel disable"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Enter a current code from your authenticator app to confirm.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button
                  variant="danger"
                  onClick={() => code.length === 6 && disableMutation.mutate(code)}
                  isLoading={disableMutation.isPending}
                  disabled={code.length !== 6 || disableMutation.isPending}
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Biometric Authentication */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Fingerprint className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Biometric Authentication</h3>
                <p className="text-sm text-muted-foreground">Use fingerprint or face recognition</p>
              </div>
            </div>
            <button
              onClick={() => setBiometricEnabled((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                biometricEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label="Toggle biometric authentication"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => saveBiometric.mutate()}
          isLoading={saveBiometric.isPending}
          disabled={saveBiometric.isPending}
        >
          Save Security Settings
        </Button>
      </div>
    </div>
  );
};
