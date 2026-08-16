'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, MessageCircle, FileText, CreditCard, Wrench, Home } from 'lucide-react';
import { SaveButton } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { NotificationPreference as FetchedPreference } from '@/services/renterService';

interface NotificationPreference {
  id: string;
  category: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

const CATEGORY_META: { category: string; id: string; label: string; icon: React.ElementType }[] = [
  { category: 'application', id: 'applications', label: 'Application Updates', icon: FileText },
  { category: 'message', id: 'messages', label: 'Messages', icon: MessageCircle },
  { category: 'payment', id: 'payments', label: 'Payment Alerts', icon: CreditCard },
  { category: 'maintenance', id: 'maintenance', label: 'Maintenance Updates', icon: Wrench },
  { category: 'lease', id: 'lease', label: 'Lease Reminders', icon: Home },
  { category: 'system', id: 'system', label: 'System & Trust Score', icon: Bell },
];

const buildPreferences = (fetched?: FetchedPreference[]): NotificationPreference[] => {
  const byCategory = new Map((fetched ?? []).map((p) => [p.category, p]));
  return CATEGORY_META.map((meta) => {
    const pref = byCategory.get(meta.category);
    const channels = {
      email: pref?.email ?? true,
      push: pref?.push ?? true,
      inApp: pref?.inApp ?? true,
    };
    return {
      id: meta.id,
      category: meta.category,
      label: meta.label,
      icon: meta.icon,
      enabled: channels.email || channels.push || channels.inApp,
      channels,
    };
  });
};

export const NotificationSettings = () => {
  const { data: fetched } = useQuery({
    queryKey: renterKeys.notificationPreferences,
    queryFn: () => unwrap(renterService.listNotificationPreferences()),
  });

  return (
    <NotificationSettingsForm
      key={fetched ? 'loaded' : 'initial'}
      initial={buildPreferences(fetched)}
    />
  );
};

const NotificationSettingsForm = ({ initial }: { initial: NotificationPreference[] }) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(initial);

  const togglePreferenceMutation = useMutation({
    mutationFn: ({ category, enabled }: { prefId: string; category: string; enabled: boolean }) =>
      unwrap(
        renterService.updateNotificationPreference(category, {
          email: enabled,
          push: enabled,
          inApp: enabled,
        })
      ),
    onSuccess: (updated, { prefId }) => {
      setPreferences((prev) =>
        prev.map((p) =>
          p.id === prefId
            ? {
                ...p,
                enabled: updated.email || updated.push || updated.inApp,
                channels: { email: updated.email, push: updated.push, inApp: updated.inApp },
              }
            : p
        )
      );
    },
  });

  const togglePreference = (id: string) => {
    const pref = preferences.find((p) => p.id === id);
    if (!pref) return;
    togglePreferenceMutation.mutate({
      prefId: id,
      category: pref.category,
      enabled: !pref.enabled,
    });
  };

  const toggleChannelMutation = useMutation({
    mutationFn: ({
      category,
      channel,
      value,
    }: {
      prefId: string;
      category: string;
      channel: 'email' | 'push' | 'inApp';
      value: boolean;
    }) => unwrap(renterService.updateNotificationPreference(category, { [channel]: value })),
    onSuccess: (updated, { prefId }) => {
      setPreferences((prev) =>
        prev.map((p) =>
          p.id === prefId
            ? { ...p, channels: { email: updated.email, push: updated.push, inApp: updated.inApp } }
            : p
        )
      );
    },
  });

  const toggleChannel = (prefId: string, channel: 'email' | 'push' | 'inApp') => {
    const pref = preferences.find((p) => p.id === prefId);
    if (!pref) return;
    toggleChannelMutation.mutate({
      prefId,
      category: pref.category,
      channel,
      value: !pref.channels[channel],
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Notification Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage how and when you receive notifications
      </p>

      <div className="space-y-4">
        {preferences.map((pref) => {
          const Icon = pref.icon;
          return (
            <div key={pref.id} className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{pref.label}</h4>
                  </div>
                </div>
                <button
                  onClick={() => togglePreference(pref.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pref.enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pref.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {pref.enabled && (
                <div className="mt-3 pt-3 border-t border-border flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LegacyInput
                      type="checkbox"
                      checked={pref.channels.email}
                      onChange={() => toggleChannel(pref.id, 'email')}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LegacyInput
                      type="checkbox"
                      checked={pref.channels.push}
                      onChange={() => toggleChannel(pref.id, 'push')}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    Push
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LegacyInput
                      type="checkbox"
                      checked={pref.channels.inApp}
                      onChange={() => toggleChannel(pref.id, 'inApp')}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    In-App
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SaveButton label="Save Preferences" className="mt-4" />
    </div>
  );
};
