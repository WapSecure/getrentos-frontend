'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { NotificationPreference as FetchedPreference } from '@/services/renterService';

interface Preference {
  id: string;
  category: string;
  label: string;
  description: string;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

const CATEGORY_META: { category: string; id: string; label: string; description: string }[] = [
  {
    category: 'application',
    id: 'applications',
    label: 'Application Updates',
    description: 'Get notified about your application status changes',
  },
  {
    category: 'message',
    id: 'messages',
    label: 'Messages',
    description: 'Get notified when you receive new messages',
  },
  {
    category: 'payment',
    id: 'payments',
    label: 'Payment Alerts',
    description: 'Get notified about payment confirmations and reminders',
  },
  {
    category: 'maintenance',
    id: 'maintenance',
    label: 'Maintenance Updates',
    description: 'Get notified about maintenance request updates',
  },
  {
    category: 'lease',
    id: 'lease',
    label: 'Lease Reminders',
    description: 'Get notified about lease renewals and important dates',
  },
  {
    category: 'system',
    id: 'system',
    label: 'System & Trust Score',
    description: 'Get notified about trust score changes and security alerts',
  },
];

const buildPreferences = (fetched?: FetchedPreference[]): Preference[] => {
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
      description: meta.description,
      enabled: channels.email || channels.push || channels.inApp,
      channels,
    };
  });
};

export const NotificationPreferences = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: fetched } = useQuery({
    queryKey: renterKeys.notificationPreferences,
    queryFn: () => unwrap(renterService.listNotificationPreferences()),
  });

  return (
    <NotificationPreferencesForm
      key={fetched ? 'loaded' : 'initial'}
      initial={buildPreferences(fetched)}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded((prev) => !prev)}
    />
  );
};

const NotificationPreferencesForm = ({
  initial,
  isExpanded,
  onToggleExpand,
}: {
  initial: Preference[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const [preferences, setPreferences] = useState<Preference[]>(initial);

  const togglePreferenceMutation = useMutation({
    mutationFn: (variables: { prefId: string; category: string; enabled: boolean }) =>
      unwrap(
        renterService.updateNotificationPreference(variables.category, {
          email: variables.enabled,
          push: variables.enabled,
          inApp: variables.enabled,
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
    mutationFn: (variables: {
      prefId: string;
      category: string;
      channel: 'email' | 'push' | 'inApp';
      value: boolean;
    }) =>
      unwrap(
        renterService.updateNotificationPreference(variables.category, {
          [variables.channel]: variables.value,
        })
      ),
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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Notification Preferences</h3>
            <p className="text-xs text-gray-500">Manage how you receive notifications</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">{pref.label}</h4>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
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
                    <input
                      type="checkbox"
                      checked={pref.channels.email}
                      onChange={() => toggleChannel(pref.id, 'email')}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={pref.channels.push}
                      onChange={() => toggleChannel(pref.id, 'push')}
                      className="w-3 h-3 rounded border-border text-primary focus:ring-primary"
                    />
                    Push
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
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
          ))}
        </div>
      )}
    </div>
  );
};
