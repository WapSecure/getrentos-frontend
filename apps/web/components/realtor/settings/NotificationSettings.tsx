'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Handshake, CalendarClock, MessageCircle, Wallet, Star } from 'lucide-react';
import { Button, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';

interface NotificationPreference {
  id: string;
  label: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  offers: { label: 'Offer Updates', icon: Handshake },
  messages: { label: 'New Messages', icon: MessageCircle },
  clients: { label: 'Client Activity', icon: UserPlus },
  payments: { label: 'Commission Payouts', icon: Wallet },
  reviews: { label: 'Reviews & Ratings', icon: Star },
  viewings: { label: 'Viewing Confirmations', icon: CalendarClock },
};

export const NotificationSettings = () => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: serverPrefs = [] } = useQuery({
    queryKey: realtorKeys.settingsNotifications,
    queryFn: () => unwrap(realtorService.getNotificationPreferences()),
  });

  useEffect(() => {
    if (serverPrefs.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences(
      serverPrefs.map((p) => ({
        id: p.id,
        label: CATEGORY_META[p.id]?.label ?? p.id,
        icon: CATEGORY_META[p.id]?.icon ?? Star,
        email: p.email,
        push: p.push,
      }))
    );
  }, [serverPrefs]);

  const toggle = (id: string, channel: 'email' | 'push') => {
    setPreferences((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p)));
  };

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        realtorService.updateNotificationPreferences(
          preferences.map((p) => ({ id: p.id, email: p.email, push: p.push }))
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.settingsNotifications });
      setToast({ message: 'Notification preferences saved.', variant: 'success' });
    },
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to save your notification preferences.',
        variant: 'error',
      }),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Notifications</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose what you want to be notified about
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-end gap-8 pr-2 text-xs font-medium text-muted-foreground">
          <span className="w-11 text-center">Email</span>
          <span className="w-11 text-center">Push</span>
        </div>
        {preferences.map((pref) => {
          const Icon = pref.icon;
          return (
            <div
              key={pref.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-foreground">{pref.label}</span>
              </div>
              <div className="flex items-center gap-8">
                <div className="w-10 flex justify-center">
                  <Toggle checked={pref.email} onChange={() => toggle(pref.id, 'email')} />
                </div>
                <div className="w-10 flex justify-center">
                  <Toggle checked={pref.push} onChange={() => toggle(pref.id, 'push')} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        isLoading={save.isPending}
        disabled={preferences.length === 0 || save.isPending}
        onClick={() => save.mutate()}
      >
        Save Preferences
      </Button>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);
