'use client';

import { TextMessageConsentCard } from '@/components/shared/settings/TextMessageConsentCard';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, MessageCircle, FileText, CreditCard, Wrench, Home } from 'lucide-react';
import { Checkbox, SaveButton, Switch, useToast } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { NotificationPreference as FetchedPreference } from '@/services/renterService';
import { categorySendsEmail } from '@getrentos/shared';

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
    <>
      <TextMessageConsentCard />
      <NotificationSettingsForm
        key={fetched ? 'loaded' : 'initial'}
        initial={buildPreferences(fetched)}
      />
    </>
  );
};

const NotificationSettingsForm = ({ initial }: { initial: NotificationPreference[] }) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(initial);
  const toast = useToast();

  const patchPreference = (
    prefId: string,
    patch: (p: NotificationPreference) => NotificationPreference
  ) => setPreferences((prev) => prev.map((p) => (p.id === prefId ? patch(p) : p)));

  const togglePreferenceMutation = useMutation({
    mutationFn: ({ category, enabled }: { prefId: string; category: string; enabled: boolean }) =>
      unwrap(
        renterService.updateNotificationPreference(category, {
          email: enabled,
          push: enabled,
          inApp: enabled,
        })
      ),
    onMutate: ({ prefId, enabled }) => {
      const previous = preferences.find((p) => p.id === prefId);
      patchPreference(prefId, (p) => ({
        ...p,
        enabled,
        channels: { email: enabled, push: enabled, inApp: enabled },
      }));
      return { previous };
    },
    onError: (_error, { prefId }, context) => {
      if (context?.previous) patchPreference(prefId, () => context.previous!);
      toast.error('That notification setting did not save. Please try again.');
    },
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
    onMutate: ({ prefId, channel, value }) => {
      const previous = preferences.find((p) => p.id === prefId);
      patchPreference(prefId, (p) => ({ ...p, channels: { ...p.channels, [channel]: value } }));
      return { previous };
    },
    onError: (_error, { prefId }, context) => {
      if (context?.previous) patchPreference(prefId, () => context.previous!);
      toast.error('That notification setting did not save. Please try again.');
    },
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <h4 className="text-sm font-medium text-foreground">{pref.label}</h4>
                </div>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={() => togglePreference(pref.id)}
                  aria-label={`${pref.label} notifications`}
                />
              </div>

              {pref.enabled && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4">
                  {categorySendsEmail(pref.category) && (
                    <Checkbox
                      checked={pref.channels.email}
                      onCheckedChange={() => toggleChannel(pref.id, 'email')}
                      label="Email"
                    />
                  )}
                  <Checkbox
                    checked={pref.channels.push}
                    onCheckedChange={() => toggleChannel(pref.id, 'push')}
                    label="Push"
                  />
                  <Checkbox
                    checked={pref.channels.inApp}
                    onCheckedChange={() => toggleChannel(pref.id, 'inApp')}
                    label="In-App"
                  />
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
