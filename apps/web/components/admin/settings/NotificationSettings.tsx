'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, ShieldAlert, Gavel, ShieldCheck, AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
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

export const NotificationSettings = () => {
  const { data: fetchedPreferences } = useQuery({
    queryKey: adminKeys.notificationPreferences,
    queryFn: () => unwrap(adminService.getNotificationPreferences()),
  });

  return (
    <NotificationSettingsForm
      key={fetchedPreferences ? 'loaded' : 'initial'}
      initial={buildPreferences(fetchedPreferences)}
    />
  );
};

const NotificationSettingsForm = ({ initial }: { initial: NotificationPreference[] }) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(initial);
  const [saved, setSaved] = useState(false);

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
    onSuccess: () => {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => saveMutation.mutate();

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
                <Toggle checked={pref.email} onChange={() => toggle(pref.id, 'email')} />
              </div>
              <div className="w-10 flex justify-center">
                <Toggle checked={pref.push} onChange={() => toggle(pref.id, 'push')} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        onClick={handleSave}
        disabled={saveMutation.isPending}
        isLoading={saveMutation.isPending}
      >
        {saved && <Check className="w-4 h-4" />}
        {saved ? 'Saved' : 'Save Preferences'}
      </Button>
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
