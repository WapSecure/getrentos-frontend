'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Handshake, ShieldCheck, FileText, MessageCircle, Star, Bell } from 'lucide-react';
import { Button, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ownerService, type OwnerNotificationPreference } from '@/services/ownerService';

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  offers: { label: 'New Offers & Counters', icon: Handshake },
  escrow: { label: 'Escrow Milestone Updates', icon: ShieldCheck },
  verification: { label: 'Verification Status Changes', icon: FileText },
  messages: { label: 'New Messages', icon: MessageCircle },
  reviews: { label: 'New Reviews', icon: Star },
};

export const NotificationSettings = () => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<OwnerNotificationPreference[]>([]);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: serverPrefs = [] } = useQuery({
    queryKey: ownerKeys.notificationPrefs,
    queryFn: () => unwrap(ownerService.getNotificationPreferences()),
  });

  useEffect(() => {
    if (serverPrefs.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences(serverPrefs);
  }, [serverPrefs]);

  const toggle = (id: string, channel: 'email' | 'push') => {
    setPreferences((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p)));
  };

  const save = useMutation({
    mutationFn: () => unwrap(ownerService.updateNotificationPreferences(preferences)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.notificationPrefs });
      setToast({ message: 'Notification preferences saved.', variant: 'success' });
    },
    onError: (error) =>
      setToast({
        message: error.message || 'Failed to save notification preferences.',
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
          const meta = CATEGORY_META[pref.id] ?? { label: pref.id, icon: Bell };
          const Icon = meta.icon;
          return (
            <div
              key={pref.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-foreground">{meta.label}</span>
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
