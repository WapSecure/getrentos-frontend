'use client';

import { TextMessageConsentCard } from '@/components/shared/settings/TextMessageConsentCard';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Handshake, ShieldCheck, MessageCircle, CalendarClock, Heart, Bell } from 'lucide-react';
import { Button, Switch, useToast } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService, type BuyerNotificationPreference } from '@/services/buyerService';
import { categorySendsEmail } from '@getrentos/shared';

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  offers: { label: 'Offer Updates & Counters', icon: Handshake },
  escrow: { label: 'Purchase payment updates', icon: ShieldCheck },
  viewings: { label: 'Viewing Confirmations', icon: CalendarClock },
  messages: { label: 'New Messages', icon: MessageCircle },
  saved: { label: 'Price Drops on Saved Properties', icon: Heart },
};

export const NotificationSettings = () => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<BuyerNotificationPreference[]>([]);
  const toast = useToast();

  const { data: serverPrefs = [] } = useQuery({
    queryKey: buyerKeys.notificationPrefs,
    queryFn: () => unwrap(buyerService.getNotificationPreferences()),
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
    mutationFn: () => unwrap(buyerService.updateNotificationPreferences(preferences)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.notificationPrefs });
      toast.success('Notification preferences saved.');
    },
    onError: (error) => toast.error(error.message || 'Failed to save notification preferences.'),
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
          const meta = CATEGORY_META[pref.id] ?? { label: pref.id, icon: Bell };
          const Icon = meta.icon;
          return (
            <div
              key={pref.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{meta.label}</span>
              </div>
              <div className="flex items-center gap-8">
                <div className="w-10 flex justify-center">
                  {categorySendsEmail(pref.id) ? (
                    <Switch
                      checked={pref.email}
                      onCheckedChange={() => toggle(pref.id, 'email')}
                      aria-label={`${meta.label} by email`}
                    />
                  ) : (
                    <NoEmail />
                  )}
                </div>
                <div className="w-10 flex justify-center">
                  <Switch
                    checked={pref.push}
                    onCheckedChange={() => toggle(pref.id, 'push')}
                    aria-label={`${meta.label} by push`}
                  />
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
