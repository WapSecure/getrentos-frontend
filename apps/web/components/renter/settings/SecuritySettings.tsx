'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, X } from 'lucide-react';
import { Button, IconButton, NumberInput, Switch, useToast } from '@getrentos/ui';
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
      </div>
    </div>
  );
};
