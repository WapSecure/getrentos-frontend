'use client';

import { LegacyInput } from '@getrentos/ui';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button, Toast, ToastVariant } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface WhatsAppState {
  connected: boolean;
  phone: string;
  preferences: Record<string, boolean>;
}

const DEFAULT_PREFERENCES: Record<string, boolean> = {
  payments: true,
  maintenance: true,
  messages: true,
  lease: true,
  credit: false,
};

const PREFERENCE_LABELS: { id: string; label: string }[] = [
  { id: 'payments', label: 'Rent & Flex Payment Reminders' },
  { id: 'maintenance', label: 'Maintenance Updates' },
  { id: 'messages', label: 'New Messages from Landlord' },
  { id: 'lease', label: 'Lease Renewal Alerts' },
  { id: 'credit', label: 'Credit Reporting Confirmations' },
];

export const WhatsAppSettings = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<WhatsAppState>({
    connected: false,
    phone: '',
    preferences: { ...DEFAULT_PREFERENCES },
  });
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data } = useQuery({
    queryKey: renterKeys.settingsPreferences,
    queryFn: () => unwrap(renterService.getSettingsPreferences()),
  });

  useEffect(() => {
    const saved = data?.whatsapp as Partial<WhatsAppState> | undefined;
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((prev) => ({
        ...prev,
        connected: saved.connected ?? prev.connected,
        phone: saved.phone ?? prev.phone,
        preferences: { ...prev.preferences, ...(saved.preferences ?? {}) },
      }));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (next: WhatsAppState) =>
      unwrap(renterService.updateSettingsPreferences({ whatsapp: next })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.settingsPreferences });
      setToast({ message: 'WhatsApp settings saved', variant: 'success' });
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'Failed to save WhatsApp settings', variant: 'error' }),
  });

  const togglePreference = (id: string) =>
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [id]: !prev.preferences[id] },
    }));

  const handleConnect = () => {
    if (!state.phone.trim()) return;
    saveMutation.mutate({ ...state, connected: true });
  };

  const handleDisconnect = () => {
    saveMutation.mutate({ connected: false, phone: '', preferences: state.preferences });
  };

  return (
    <div>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <h2 className="text-xl font-semibold text-foreground mb-4">WhatsApp Notifications</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Get rent reminders, maintenance updates, and messages on WhatsApp instead of relying on
        email or push alerts.
      </p>

      {!state.connected ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary">
            <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              Add your WhatsApp number to receive notifications there. Actual message delivery is
              handled by our notification channel once connected.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              WhatsApp Number
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <LegacyInput
                type="tel"
                value={state.phone}
                onChange={(e) => setState((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+234 803 000 0000"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleConnect}
            disabled={!state.phone.trim() || saveMutation.isPending}
            isLoading={saveMutation.isPending}
          >
            Connect WhatsApp
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-foreground">Connected to {state.phone}</p>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll receive selected notifications on WhatsApp.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-red-500" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>

          <div className="space-y-2">
            {PREFERENCE_LABELS.map((pref) => (
              <div
                key={pref.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <span className="text-sm text-foreground">{pref.label}</span>
                <button
                  onClick={() => togglePreference(pref.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    state.preferences[pref.id] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      state.preferences[pref.id] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={() => saveMutation.mutate(state)}
            isLoading={saveMutation.isPending}
            disabled={saveMutation.isPending}
          >
            Save WhatsApp Settings
          </Button>
        </div>
      )}
    </div>
  );
};
