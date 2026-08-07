'use client';

import { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageCircle,
  FileText,
  CreditCard,
  Wrench,
  Home,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NotificationPreference {
  id: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

export const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'applications',
      label: 'Application Updates',
      icon: FileText,
      enabled: true,
      channels: { email: true, push: true, inApp: true },
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      enabled: true,
      channels: { email: true, push: true, inApp: true },
    },
    {
      id: 'payments',
      label: 'Payment Alerts',
      icon: CreditCard,
      enabled: true,
      channels: { email: true, push: true, inApp: true },
    },
    {
      id: 'maintenance',
      label: 'Maintenance Updates',
      icon: Wrench,
      enabled: true,
      channels: { email: true, push: true, inApp: true },
    },
    {
      id: 'lease',
      label: 'Lease Reminders',
      icon: Home,
      enabled: true,
      channels: { email: true, push: true, inApp: true },
    },
    {
      id: 'promotions',
      label: 'Promotions & Offers',
      icon: Bell,
      enabled: false,
      channels: { email: true, push: false, inApp: false },
    },
  ]);

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
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Notification Settings
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Manage how and when you receive notifications
      </p>

      <div className="space-y-4">
        {preferences.map((pref) => {
          const Icon = pref.icon;
          return (
            <div
              key={pref.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {pref.label}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => togglePreference(pref.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pref.enabled ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
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
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={pref.channels.email}
                      onChange={() => toggleChannel(pref.id, 'email')}
                      className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-[#c4a747] focus:ring-[#c4a747]"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={pref.channels.push}
                      onChange={() => toggleChannel(pref.id, 'push')}
                      className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-[#c4a747] focus:ring-[#c4a747]"
                    />
                    Push
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={pref.channels.inApp}
                      onChange={() => toggleChannel(pref.id, 'inApp')}
                      className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-[#c4a747] focus:ring-[#c4a747]"
                    />
                    In-App
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button variant="primary" className="mt-4">
        Save Preferences
      </Button>
    </div>
  );
};
