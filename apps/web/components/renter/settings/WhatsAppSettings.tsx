'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button, Field, Input, Switch, useToast } from '@getrentos/ui';
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
  const toast = useToast();

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
      toast.success('WhatsApp settings saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save WhatsApp settings'),
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
      <h2 className="text-xl font-semibold text-foreground mb-4">WhatsApp Notifications</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Get rent reminders, maintenance updates, and messages on WhatsApp instead of relying on
        email or push alerts.
      </p>

      {!state.connected ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary">
            <div className="w-9 h-9 rounded-lg bg-success-subtle flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-success" aria-hidden="true" />
            </div>
            <p className="text-xs text-muted-foreground">
              Add your WhatsApp number to receive notifications there. Actual message delivery is
              handled by our notification channel once connected.
            </p>
          </div>

          <Field label="WhatsApp Number">
            <Input
              leadingIcon={<Smartphone className="w-4 h-4" />}
              type="tel"
              value={state.phone}
              onChange={(e) => setState((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+234 803 000 0000"
            />
          </Field>

          <Button
            variant="primary"
            onClick={handleConnect}
            disabled={!state.phone.trim()}
            isLoading={saveMutation.isPending}
          >
            Connect WhatsApp
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-success-subtle border border-success/20">
            <div className="flex min-w-0 items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-success" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Connected to {state.phone}</p>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll receive selected notifications on WhatsApp.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={handleDisconnect}
              isLoading={saveMutation.isPending && saveMutation.variables?.connected === false}
            >
              Disconnect
            </Button>
          </div>

          <div className="space-y-2">
            {PREFERENCE_LABELS.map((pref) => (
              <div key={pref.id} className="p-3 rounded-lg border border-border">
                <Switch
                  className="w-full"
                  checked={!!state.preferences[pref.id]}
                  onCheckedChange={() => togglePreference(pref.id)}
                  label={pref.label}
                />
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            className="w-full"
            onClick={() => saveMutation.mutate(state)}
            isLoading={saveMutation.isPending}
          >
            Save WhatsApp Settings
          </Button>
        </div>
      )}
    </div>
  );
};
