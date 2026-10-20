'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Checkbox, Switch } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { NotificationPreference as FetchedPreference } from '@/services/renterService';
import { categorySendsEmail } from '@getrentos/shared';

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
    meta: { showGlobalError: true },
    onMutate: ({ prefId, enabled }) => {
      const previous = preferences;
      setPreferences((prev) =>
        prev.map((p) =>
          p.id === prefId
            ? { ...p, enabled, channels: { email: enabled, push: enabled, inApp: enabled } }
            : p
        )
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context) setPreferences(context.previous);
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
    meta: { showGlobalError: true },
    onMutate: ({ prefId, channel, value }) => {
      const previous = preferences;
      setPreferences((prev) =>
        prev.map((p) =>
          p.id === prefId ? { ...p, channels: { ...p.channels, [channel]: value } } : p
        )
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context) setPreferences(context.previous);
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
    <Card>
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Notification Preferences</h3>
            <p className="text-xs text-muted-foreground">Manage how you receive notifications</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {preferences.map((pref) => (
            <div key={pref.id} className="p-3 rounded-lg bg-secondary border border-border">
              <Switch
                label={pref.label}
                description={pref.description}
                checked={pref.enabled}
                onCheckedChange={() => togglePreference(pref.id)}
              />

              {pref.enabled && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4">
                  {categorySendsEmail(pref.category) && (
                    <Checkbox
                      label="Email"
                      checked={pref.channels.email}
                      onCheckedChange={() => toggleChannel(pref.id, 'email')}
                    />
                  )}
                  <Checkbox
                    label="Push"
                    checked={pref.channels.push}
                    onCheckedChange={() => toggleChannel(pref.id, 'push')}
                  />
                  <Checkbox
                    label="In-App"
                    checked={pref.channels.inApp}
                    onCheckedChange={() => toggleChannel(pref.id, 'inApp')}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
