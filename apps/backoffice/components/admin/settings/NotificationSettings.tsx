'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShieldAlert, Gavel, ShieldCheck, AlertTriangle, MessageCircle } from 'lucide-react';
import { Button, PageErrorState, PageLoadingState, Toast, type ToastVariant } from '@getrentos/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import type { NotificationPreferenceId } from '@/types/admin';

interface NotificationPreference {
  id: NotificationPreferenceId;
  label: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
}

const PREFERENCE_META: { id: NotificationPreferenceId; label: string; icon: React.ElementType }[] =
  [
    { id: 'fraud', label: 'Fraud Alerts', icon: ShieldAlert },
    { id: 'disputes', label: 'New & Escalated Disputes', icon: Gavel },
    { id: 'verifications', label: 'Verification Requests', icon: ShieldCheck },
    { id: 'escrow', label: 'Flagged Escrow Transactions', icon: AlertTriangle },
    { id: 'messages', label: 'New Support Messages', icon: MessageCircle },
  ];

const buildPreferences = (
  fetched?: { id: NotificationPreferenceId; email: boolean; push: boolean }[]
): NotificationPreference[] => {
  const byId = new Map((fetched ?? []).map((p) => [p.id, p]));
  return PREFERENCE_META.map((meta) => ({
    ...meta,
    email: byId.get(meta.id)?.email ?? true,
    push: byId.get(meta.id)?.push ?? true,
  }));
};

export const NotificationSettings = ({
  onDirtyChange,
}: {
  onDirtyChange: (dirty: boolean) => void;
}) => {
  const {
    data: fetchedPreferences,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: adminKeys.notificationPreferences,
    queryFn: () => unwrap(adminService.getNotificationPreferences()),
  });

  if (isLoading) return <PageLoadingState />;
  if (isError || !fetchedPreferences)
    return (
      <PageErrorState
        title="Notification preferences unavailable"
        description="Your saved preferences could not be loaded. Editing is disabled to avoid replacing them with defaults."
        onRetry={() => refetch()}
        isRetrying={isFetching}
        className="min-h-80 border-0"
      />
    );
  return (
    <NotificationSettingsForm
      key={JSON.stringify(fetchedPreferences)}
      initial={buildPreferences(fetchedPreferences)}
      onDirtyChange={onDirtyChange}
    />
  );
};

const NotificationSettingsForm = ({
  initial,
  onDirtyChange,
}: {
  initial: NotificationPreference[];
  onDirtyChange: (dirty: boolean) => void;
}) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(initial);
  const [baseline, setBaseline] = useState(initial);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const isDirty = JSON.stringify(preferences) !== JSON.stringify(baseline);

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  const toggle = (id: string, channel: 'email' | 'push') => {
    setPreferences((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p)));
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      unwrap(
        adminService.updateNotificationPreferences(
          preferences.map(({ id, email, push }) => ({ id, email, push }))
        )
      ),
    onSuccess: (savedPreferences) => {
      const next = buildPreferences(savedPreferences);
      setPreferences(next);
      setBaseline(next);
      setToast({ message: 'Notification preferences saved.', variant: 'success' });
    },
    onError: (error: Error) =>
      setToast({
        message: error.message || 'Notification preferences could not be saved.',
        variant: 'error',
      }),
  });

  const handleSave = () => saveMutation.mutate();

  return (
    <div>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <h2 className="text-xl font-semibold text-foreground mb-4">Notifications</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose what you want to be notified about
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-end gap-8 pr-2 text-xs font-medium text-muted-foreground">
          <span className="w-11 text-center">Email</span>
          <span className="w-11 text-center">Push</span>
        </div>
        {preferences.map((pref) => (
          <div
            key={pref.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border"
          >
            <div className="flex items-center gap-3">
              <pref.icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-foreground">{pref.label}</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="w-10 flex justify-center">
                <Toggle
                  label={`${pref.label} email notifications`}
                  checked={pref.email}
                  onChange={() => toggle(pref.id, 'email')}
                />
              </div>
              <div className="w-10 flex justify-center">
                <Toggle
                  label={`${pref.label} push notifications`}
                  checked={pref.push}
                  onChange={() => toggle(pref.id, 'push')}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        onClick={handleSave}
        disabled={!isDirty || saveMutation.isPending}
        isLoading={saveMutation.isPending}
      >
        Save Preferences
      </Button>
    </div>
  );
};

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
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
