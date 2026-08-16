'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Fingerprint } from 'lucide-react';
import { Button, Toast, ToastVariant } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface SecurityState {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
}

export const SecuritySettings = () => {
  const queryClient = useQueryClient();
  const [security, setSecurity] = useState<SecurityState>({
    twoFactorEnabled: false,
    biometricEnabled: false,
  });
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data } = useQuery({
    queryKey: renterKeys.settingsPreferences,
    queryFn: () => unwrap(renterService.getSettingsPreferences()),
  });

  useEffect(() => {
    const saved = data?.security as Partial<SecurityState> | undefined;
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecurity((prev) => ({ ...prev, ...saved }));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => unwrap(renterService.updateSettingsPreferences({ security })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.settingsPreferences });
      setToast({ message: 'Security settings saved', variant: 'success' });
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'Failed to save security settings', variant: 'error' }),
  });

  const toggle = (key: keyof SecurityState) =>
    setSecurity((prev) => ({ ...prev, [key]: !prev[key] }));

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
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <button
              onClick={() => toggle('twoFactorEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                security.twoFactorEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
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
              onClick={() => toggle('biometricEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                security.biometricEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  security.biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => saveMutation.mutate()}
          isLoading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Security Settings
        </Button>
      </div>
    </div>
  );
};
