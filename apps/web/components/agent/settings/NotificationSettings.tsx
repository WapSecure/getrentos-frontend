'use client';

import { TextMessageConsentCard } from '@/components/shared/settings/TextMessageConsentCard';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, ShieldCheck } from 'lucide-react';
import { Button, Switch, useToast } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { categorySendsEmail } from '@getrentos/shared';

interface NotificationPreference {
  id: string;
  label: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
}

// Only what is actually sent to an agent; the server returns these categories.
const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  verification: { label: 'Verification Results', icon: ShieldCheck },
  system: { label: 'Account & Listing Updates', icon: Bell },
};

export const NotificationSettings = () => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const toast = useToast();

  const { data: serverPrefs = [] } = useQuery({
    queryKey: agentKeys.settingsNotifications,
    queryFn: () => unwrap(agentService.getNotificationPreferences()),
  });

  useEffect(() => {
    if (serverPrefs.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences(
      serverPrefs.map((p) => ({
        id: p.id,
        label: CATEGORY_META[p.id]?.label ?? p.id,
        icon: CATEGORY_META[p.id]?.icon ?? Bell,
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
        agentService.updateNotificationPreferences(
          preferences.map((p) => ({ id: p.id, email: p.email, push: p.push }))
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.settingsNotifications });
      toast.success('Notification preferences saved.');
    },
    onError: (error) =>
      toast.error(error.message || 'Unable to save your notification preferences.'),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Notifications</h2>
      <TextMessageConsentCard />
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
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-foreground">{pref.label}</span>
              </div>
              <div className="flex items-center gap-8">
                <div className="w-10 flex justify-center">
                  {categorySendsEmail(pref.id) ? (
                    <Switch
                      size="sm"
                      checked={pref.email}
                      onCheckedChange={() => toggle(pref.id, 'email')}
                      aria-label={`${pref.label} by email`}
                    />
                  ) : (
                    <NoEmail />
                  )}
                </div>
                <div className="w-10 flex justify-center">
                  <Switch
                    size="sm"
                    checked={pref.push}
                    onCheckedChange={() => toggle(pref.id, 'push')}
                    aria-label={`${pref.label} by push`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="primary"
        className="mt-6"
        isLoading={save.isPending}
        disabled={preferences.length === 0}
        onClick={() => save.mutate()}
      >
        Save Preferences
      </Button>
    </div>
  );
};

/** Shown where a category has no email: these updates are in-app and push only. */
const NoEmail = () => (
  <span
    className="text-xs text-muted-foreground"
    title="Not sent by email. Email is for payments, offers and verification."
    aria-label="Not sent by email"
  >
    —
  </span>
);
