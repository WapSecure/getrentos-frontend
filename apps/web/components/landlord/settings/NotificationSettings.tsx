'use client';

import { useState, useEffect } from 'react';
import { CreditCard, FileText, Wrench, MessageCircle, Star } from 'lucide-react';
import { SaveButton } from '@getrentos/ui';
import { landlordService, type LandlordNotificationPreference } from '@/services/landlordService';

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

      <SaveButton label="Save Preferences" className="mt-6" onClick={handleSave} />
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
