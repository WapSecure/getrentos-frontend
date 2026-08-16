'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface Preference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

const defaultPreferences: Preference[] = [
  {
    id: 'applications',
    label: 'Application Updates',
    description: 'Get notified about your application status changes',
    enabled: true,
    channels: { email: true, push: true, inApp: true },
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Get notified when you receive new messages',
    enabled: true,
    channels: { email: true, push: true, inApp: true },
  },
  {
    id: 'payments',
    label: 'Payment Alerts',
    description: 'Get notified about payment confirmations and reminders',
    enabled: true,
    channels: { email: true, push: true, inApp: true },
  },
  {
    id: 'maintenance',
    label: 'Maintenance Updates',
    description: 'Get notified about maintenance request updates',
    enabled: true,
    channels: { email: true, push: true, inApp: true },
  },
  {
    id: 'lease',
    label: 'Lease Reminders',
    description: 'Get notified about lease renewals and important dates',
    enabled: true,
    channels: { email: true, push: true, inApp: true },
  },
  {
    id: 'promotions',
    label: 'Promotions & Offers',
    description: 'Get notified about special offers and promotions',
    enabled: false,
    channels: { email: true, push: false, inApp: false },
  },
];

export const NotificationPreferences = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [preferences, setPreferences] = useState(defaultPreferences);

  const togglePreference = (id: string) => {
    setPreferences((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  };

  const toggleChannel = (prefId: string, channel: 'email' | 'push' | 'inApp') => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.id === prefId ? { ...p, channels: { ...p.channels, [channel]: !p.channels[channel] } } : p
      )
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
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
          ))}
        </div>
      )}
    </div>
  );
};
