'use client';

import { TextMessageConsentCard } from '@/components/shared/settings/TextMessageConsentCard';

import { useState, useEffect } from 'react';
import { CreditCard, FileText, Wrench, MessageCircle, Star } from 'lucide-react';
import { SaveButton, Switch } from '@getrentos/ui';
import { landlordService, type LandlordNotificationPreference } from '@/services/landlordService';
import { categorySendsEmail } from '@getrentos/shared';

interface NotificationPreference extends LandlordNotificationPreference {
  label: string;
  icon: React.ElementType;
}

const PREFERENCE_META: {
  id: LandlordNotificationPreference['id'];
  label: string;
  icon: React.ElementType;
}[] = [
  { id: 'payments', label: 'Rent Payments Received', icon: CreditCard },
  { id: 'applications', label: 'New Rental Applications', icon: FileText },
  { id: 'maintenance', label: 'Maintenance Requests', icon: Wrench },
  { id: 'messages', label: 'New Messages', icon: MessageCircle },
  { id: 'reviews', label: 'New Reviews', icon: Star },
];

const DEFAULT_PREFERENCES: NotificationPreference[] = PREFERENCE_META.map((meta) => ({
  ...meta,
  email: true,
  push: true,
}));

export const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const fetchPreferences = async () => {
      const response = await landlordService.getNotificationPreferences();
      if (response.success && response.data) {
        const byId = new Map(response.data.map((p) => [p.id, p]));
        setPreferences(
          PREFERENCE_META.map((meta) => ({
            ...meta,
            email: byId.get(meta.id)?.email ?? true,
            push: byId.get(meta.id)?.push ?? true,
          }))
        );
      }
    };

    fetchPreferences();
  }, []);

  const toggle = (id: string, channel: 'email' | 'push') => {
    setPreferences((prev) => prev.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p)));
  };

  const handleSave = () => {
    landlordService.updateNotificationPreferences(
      preferences.map(({ id, email, push }) => ({ id, email, push }))
    );
  };

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
        {preferences.map((pref) => (
          <div
            key={pref.id}
            className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
          >
            <div className="flex min-w-0 items-center gap-3">
              <pref.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="text-sm text-foreground">{pref.label}</span>
            </div>
            <div className="flex shrink-0 items-center gap-8">
              <div className="w-10 flex justify-center">
                {categorySendsEmail(pref.id) ? (
                  <Switch
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
                  checked={pref.push}
                  onCheckedChange={() => toggle(pref.id, 'push')}
                  aria-label={`${pref.label} by push`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <SaveButton label="Save Preferences" className="mt-6" onClick={handleSave} />
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
